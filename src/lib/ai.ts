import type { Question, Subject } from '../types'
import { CATEGORIES } from '../data/curriculum'

/* ------------------------------------------------------------------ *
 * 配置：Base URL + API Key + 模型，存在浏览器 localStorage 里。
 * 兼容所有 OpenAI 格式的服务商（DeepSeek / 通义 / 智谱 / Kimi / OpenAI …）。
 * ------------------------------------------------------------------ */

export interface AIConfig {
  baseUrl: string
  apiKey: string
  model: string
}

const STORAGE_KEY = 'guanjiandian.ai.v1'

export const DEFAULT_AI_CONFIG: AIConfig = {
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
}

export function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_AI_CONFIG }
    const parsed = JSON.parse(raw) as Partial<AIConfig>
    return { ...DEFAULT_AI_CONFIG, ...parsed }
  } catch {
    return { ...DEFAULT_AI_CONFIG }
  }
}

export function saveAIConfig(cfg: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}

export function isAIConfigured(): boolean {
  const c = loadAIConfig()
  return !!c.apiKey.trim() && !!c.baseUrl.trim() && !!c.model.trim()
}

/* ------------------------------------------------------------------ *
 * 底层调用
 * ------------------------------------------------------------------ */

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  json?: boolean
  temperature?: number
  signal?: AbortSignal
}

async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const cfg = loadAIConfig()
  if (!cfg.apiKey.trim()) throw new Error('还没配置 API Key，请先点右上角「设置」。')

  const url = cfg.baseUrl.replace(/\/+$/, '') + '/chat/completions'
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: opts.temperature ?? 0.7,
    stream: false,
  }
  if (opts.json) body.response_format = { type: 'json_object' }

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey.trim()}`,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    })
  } catch {
    throw new Error('连不上 AI 服务，请检查网络和「设置」里的接口地址。')
  }

  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message ?? ''
    } catch {
      /* ignore */
    }
    throw new Error(`AI 返回错误（${res.status}）${detail ? '：' + detail : ''}`)
  }

  const data = await res.json()
  const content: string = data?.choices?.[0]?.message?.content ?? ''
  if (!content) throw new Error('AI 没有返回内容，请重试。')
  return content
}

/** 从可能带 markdown 包裹的文本里，抠出第一个 JSON 对象 */
function extractJSON<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced ? fenced[1] : text).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('AI 返回的不是有效题目，请重试。')
  return JSON.parse(candidate.slice(start, end + 1)) as T
}

/* ------------------------------------------------------------------ *
 * 实时出题
 * ------------------------------------------------------------------ */

const SUBJECT_LABEL: Record<Subject, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
}

const QUESTION_SYSTEM = `你是一位中国小学的资深老师，专门训练学生"读懂题目"的能力。
你出的题只考察一件事：学生能否抓住题干里的关键信息，并说清这道题到底在问什么。
只输出 JSON，不要任何解释文字。`

function buildQuestionPrompt(subject: Subject, difficulty: 1 | 2 | 3, categoryId?: string): string {
  const diffWord = { 1: '基础', 2: '进阶', 3: '挑战' }[difficulty]
  const cat = categoryId ? CATEGORIES.find((c) => c.id === categoryId) : undefined
  const catLine = cat
    ? `\n本题型必须是「${cat.name}」——${cat.desc}。请出符合这个题型的题。`
    : ''
  return `请出一道${SUBJECT_LABEL[subject]}的读题训练题，面向小学四到六年级，难度为「${diffWord}」。${catLine}

要求：
1. stem：题目原文（题干本身，一段话，20~60 字）。学科不同形态不同：
   - 语文：如"用简洁的语言概括第三自然段的主要内容"这类题干；
   - 数学：一道应用题题干（含数据、单位、条件、问题）；
   - 英语：如"根据对话选择正确答案：Where is the library?"这类题干（可中英混排）。
2. keywords：题干中的关键信息，3~5 处。每一项 { "text": "题干中原文片段（必须与 stem 逐字一致）", "reason": "为什么它是关键信息（讲给孩子听，20 字内）", "role": 从 task/object/data/condition/target/trap 中选一个 }。
   - task=要求做什么；object=对象/范围；data=数据单位；condition=限制条件；target=最终要问的；trap=易漏的陷阱词。
3. options：4 个"这道题在问什么"的说法，恰好 1 个正确、3 个是**近似干扰项**。干扰项要对应常见读题错误（看错范围、答非所问、只答一半、混淆概念）。每一项 { "text": "...", "correct": true/false, "analysis": "为什么对/错，指出错在哪种读题毛病（30 字内）" }。
4. tip：一句话解题提示（30 字内）。

严格按此 JSON 结构输出：
{"stem":"","keywords":[{"text":"","reason":"","role":"task"}],"options":[{"text":"","correct":true,"analysis":""},{"text":"","correct":false,"analysis":""},{"text":"","correct":false,"analysis":""},{"text":"","correct":false,"analysis":""}],"tip":""}`
}

function validateQuestion(
  raw: unknown,
  subject: Subject,
  difficulty: 1 | 2 | 3,
  categoryId: string,
): Question {
  const q = raw as Partial<Question>
  if (!q || typeof q.stem !== 'string' || !Array.isArray(q.keywords) || !Array.isArray(q.options)) {
    throw new Error('AI 出的题格式不对，请重试。')
  }
  const options = q.options.filter((o) => o && typeof o.text === 'string')
  if (options.length < 4) throw new Error('AI 出的选项不足 4 个，请重试。')
  const correctCount = options.filter((o) => o.correct).length
  if (correctCount !== 1) throw new Error('AI 出的题正确答案不唯一，请重试。')

  return {
    id: `ai-${subject}-${Date.now()}`,
    subject,
    category: categoryId,
    grade: '四-六年级',
    difficulty,
    stem: q.stem,
    keywords: q.keywords
      .filter((k) => k && typeof k.text === 'string' && q.stem!.includes(k.text))
      .slice(0, 6)
      .map((k) => ({ text: k.text, reason: k.reason ?? '', role: k.role })),
    options: options.slice(0, 4).map((o) => ({
      text: o.text,
      correct: !!o.correct,
      analysis: o.analysis ?? '',
    })),
    tip: q.tip ?? '',
    source: 'ai',
  }
}

export async function generateQuestion(
  subject: Subject,
  difficulty: 1 | 2 | 3,
  categoryId: string,
  signal?: AbortSignal,
): Promise<Question> {
  const content = await chat(
    [
      { role: 'system', content: QUESTION_SYSTEM },
      { role: 'user', content: buildQuestionPrompt(subject, difficulty, categoryId) },
    ],
    { json: true, temperature: 0.9, signal },
  )
  return validateQuestion(extractJSON(content), subject, difficulty, categoryId)
}

/* ------------------------------------------------------------------ *
 * 陪读问答：孩子向 AI 提问
 * ------------------------------------------------------------------ */

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export async function askTutor(
  question: Question | null,
  history: ChatTurn[],
  userMessage: string,
  signal?: AbortSignal,
): Promise<string> {
  const sys = `你是一位耐心、亲切的小学老师，正在陪一个四到六年级的孩子做"读懂题目"的练习。
用简体中文回答，语气鼓励、口语化，句子简短，多用"我们""你看"这样的说法，不要用markdown标题和长列表。
不要直接报答案就完事——先引导孩子自己想，再一步步讲清楚"题目在问什么""哪个词最关键"。
如果孩子只是问字词意思或知识点，就直接讲明白，并举一个简单的例子。`
  const ctx = question
    ? `当前题目：${question.stem}\n（这道题的正确核心意思是：${
        question.options.find((o) => o.correct)?.text ?? ''
      }）`
    : '现在没有正在做的题目。'
  const messages: ChatMessage[] = [
    { role: 'system', content: sys },
    { role: 'system', content: ctx },
    ...history.slice(-8).map((t) => ({ role: t.role, content: t.content })),
    { role: 'user', content: userMessage },
  ]
  return chat(messages, { temperature: 0.6, signal })
}

/** 让 AI 针对孩子这次的错误，讲一段个性化点评 */
export async function explainMistake(
  question: Question,
  missedTexts: string[],
  chosenOption: string,
  signal?: AbortSignal,
): Promise<string> {
  const sys = `你是小学老师，针对孩子的一次读题作答给出简短点评和鼓励，60~100 字，简体中文，口语化。`
  const prompt = `题目：${question.stem}
正确核心意思：${question.options.find((o) => o.correct)?.text}
孩子漏掉的关键信息：${missedTexts.join('、') || '（无）'}
孩子误选的意思：${chosenOption}
请用两三句话点评：孩子这次读题的问题出在哪，下次怎么注意，最后给一句鼓励。`
  return chat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, signal },
  )
}
