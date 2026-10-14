import type { Question, Subject } from '../types'
import { CATEGORIES } from '../data/curriculum'
import SPEC from '../../docs/出题规范.md?raw'

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
  const baseBody: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: opts.temperature ?? 0.7,
    stream: false,
  }

  const send = async (body: Record<string, unknown>): Promise<Response> => {
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg.apiKey.trim()}`,
        },
        body: JSON.stringify(body),
        signal: opts.signal,
      })
    } catch {
      throw new Error(
        '连不上 AI 服务：请检查网络、接口地址，以及该服务商是否允许浏览器跨域调用（CORS）。',
      )
    }
  }

  let res = await send(
    opts.json ? { ...baseBody, response_format: { type: 'json_object' } } : baseBody,
  )

  // 有些服务商不支持 response_format，遇到 400 就去掉再试一次
  if (!res.ok && opts.json && res.status === 400) {
    res = await send(baseBody)
  }

  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.error?.message ?? err?.message ?? ''
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

/** 测试连接：发一句最小请求，通了就返回模型回复 */
export async function testConnection(signal?: AbortSignal): Promise<string> {
  const content = await chat(
    [{ role: 'user', content: '只回复两个字：可以' }],
    { temperature: 0, signal },
  )
  return content.trim().slice(0, 40)
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
 * 实时出题 —— 严格按项目《出题规范》（docs/出题规范.md）
 * ------------------------------------------------------------------ */

const SUBJECT_LABEL: Record<Subject, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语',
}

const QUESTION_SYSTEM = `你是一位中国小学的资深老师，专门训练学生"读懂题目"的能力。
你出的题只考察一件事：学生能否抓住题干里的关键信息，并说清这道题到底在问什么。

下面是本项目的《出题规范》，请严格遵守，只输出 JSON，不要任何多余文字：

${SPEC}`

function buildQuestionPrompt(subject: Subject, difficulty: 1 | 2 | 3, categoryId?: string): string {
  const diffWord = { 1: '基础', 2: '进阶', 3: '挑战' }[difficulty]
  const cat = categoryId ? CATEGORIES.find((c) => c.id === categoryId) : undefined
  const form = cat?.mode === 'select' ? '分组题' : '普通题'
  return `请按上面的《出题规范》，出一道读题训练题：

- 学科：${SUBJECT_LABEL[subject]}
- 题型：${cat ? `${cat.name}（${cat.desc}）` : '综合'}
- 难度：${diffWord}
- 形态：${form}（严格按规范里对应的输出格式）

只输出符合规范的 JSON。`
}

function validateQuestion(
  raw: unknown,
  subject: Subject,
  difficulty: 1 | 2 | 3,
  categoryId: string,
): Question {
  const q = raw as Partial<Question>
  if (!q || typeof q.stem !== 'string') throw new Error('AI 出的题格式不对，请重试。')

  const id = `ai-${subject}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // 分组题
  if (Array.isArray(q.groups) && q.groups.length) {
    const groups = q.groups
      .filter(
        (g) => g && Array.isArray(g.options) && g.options.length >= 2 && Array.isArray(g.correct),
      )
      .map((g) => ({
        label: String(g.label ?? ''),
        multiple: !!g.multiple,
        options: g.options.map((o) => String(o)),
        correct: g.correct.filter(
          (i) => Number.isInteger(i) && i >= 0 && i < g.options.length,
        ),
        notes: Array.isArray(g.notes) ? g.notes.map((n) => String(n)) : undefined,
      }))
      .filter((g) => g.correct.length > 0 && (g.multiple || g.correct.length === 1))
    if (!groups.length) throw new Error('AI 出的分组题格式不对，请重试。')
    return {
      id,
      subject,
      category: categoryId,
      grade: '四-六年级',
      difficulty,
      stem: q.stem,
      keywords: [],
      options: [],
      groups,
      tip: q.tip ?? '',
      source: 'ai',
    }
  }

  // 普通题
  if (!Array.isArray(q.keywords) || !Array.isArray(q.options)) {
    throw new Error('AI 出的题格式不对，请重试。')
  }
  const options = q.options.filter((o) => o && typeof o.text === 'string')
  if (options.length < 4) throw new Error('AI 出的选项不足 4 个，请重试。')
  const correctCount = options.filter((o) => o.correct).length
  if (correctCount !== 1) throw new Error('AI 出的题正确答案不唯一，请重试。')

  return {
    id,
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

/** 让 AI 针对孩子这次的作答，讲一段个性化点评 */
export async function explainMistake(
  question: Question,
  detail: string,
  signal?: AbortSignal,
): Promise<string> {
  const sys = `你是小学老师，针对孩子的一次作答给出简短点评和鼓励，60~100 字，简体中文，口语化。`
  const prompt = `题目：${question.stem}
${question.tip ? `（本题提示：${question.tip}）` : ''}
孩子这次的作答情况：${detail || '（基本读对）'}
请用两三句话点评：孩子这次的问题出在哪，下次怎么注意，最后给一句鼓励。`
  return chat(
    [
      { role: 'system', content: sys },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, signal },
  )
}
