import type { Evaluation, KeywordRole, Question, Token } from '../types'

/** 不同角色的关键信息 → 对应的读题方法建议 */
const ROLE_ADVICE: Record<KeywordRole, string> = {
  task: '先看清题目要你「做什么」——是概括、计算，还是判断，别做成了别的事。',
  object: '注意题目说的是「哪一部分、谁」，别答成了别的对象。',
  data: '把题目给的数据连同单位一起圈出来，它们往往缺一不可。',
  condition: '像「最多 / 至少 / 剪去」这类条件，决定了怎么算、能不能用。',
  target: '题目最后一句问的才是「答案」，先盯住它，再动手。',
  trap: '当心陷阱：单位是否统一、有没有「不」「除了」这类容易看漏的字眼。',
}

/**
 * 批改一次作答。
 * @param tokens      题干切分结果
 * @param selected    孩子点选的关键词 token 序号集合
 * @param chosenOption 孩子选的核心意思选项序号
 */
export function evaluate(
  question: Question,
  tokens: Token[],
  selected: Set<number>,
  chosenOption: number,
): Evaluation {
  const keyTokens = tokens.filter((t) => t.key)
  const missed = keyTokens.filter((t) => !selected.has(t.index))
  const extra = tokens.filter((t) => !t.key && selected.has(t.index))
  const hit = keyTokens.length - missed.length
  const totalKeys = keyTokens.length

  const chosen = question.options[chosenOption]
  const optionCorrect = !!chosen?.correct

  // 定级
  let level: Evaluation['level']
  if (optionCorrect && missed.length === 0 && extra.length === 0) level = 'perfect'
  else if (optionCorrect && missed.length === 0) level = 'good'
  else if (optionCorrect || missed.length === 0) level = 'partial'
  else level = 'poor'

  const headline = {
    perfect: '读得又准又全！关键信息一个没落。',
    good: '核心意思读对了，再精确一点就满分。',
    partial: optionCorrect
      ? '意思选对了，但关键信息还没圈全。'
      : '关键信息圈得不错，可惜意思理解偏了。',
    poor: '别急，我们把这道题一起再读一遍。',
  }[level]

  const advice: string[] = []

  // 1) 核心意思这一块
  if (optionCorrect) {
    advice.push(`你把题目的核心意思读对了：${chosen.text}`)
  } else {
    advice.push(`你选的是「${chosen.text}」——${chosen.analysis}`)
    const right = question.options.find((o) => o.correct)
    if (right) advice.push(`题目真正的意思是：${right.text}`)
  }

  // 2) 关键词这一块
  if (missed.length) {
    advice.push(
      `这些关键信息你漏掉了：「${missed.map((t) => t.text).join('」「')}」。` +
        `读题时先把它们圈出来，往往就是解题的突破口。`,
    )
  } else if (totalKeys > 0) {
    advice.push('题目里的关键信息你一个都没漏，很棒。')
  }
  if (extra.length) {
    advice.push(
      `你圈了「${extra.map((t) => t.text).join('」「')}」，这些是次要信息，读的时候可以一带而过。`,
    )
  }

  // 3) 按漏选关键词的角色，给出针对性的读题方法（去重）
  const roles = new Set<KeywordRole>()
  for (const t of missed) if (t.role) roles.add(t.role)
  for (const role of roles) advice.push(ROLE_ADVICE[role])

  // 4) 本题提示
  if (question.tip) advice.push(`小提示：${question.tip}`)

  return {
    optionCorrect,
    missed,
    extra,
    hit,
    totalKeys,
    level,
    headline,
    advice,
  }
}
