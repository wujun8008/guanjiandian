// 关键点 · 数据模型

/** 三个学科 */
export type Subject = 'chinese' | 'math' | 'english'

export const SUBJECTS: { id: Subject; label: string; short: string }[] = [
  { id: 'chinese', label: '语文', short: '语' },
  { id: 'math', label: '数学', short: '数' },
  { id: 'english', label: '英语', short: '英' },
]

/** 难度标签 */
export const DIFFICULTY_LABEL: Record<number, string> = { 1: '基础', 2: '进阶', 3: '挑战' }

/** 题干中的一处关键信息 */
export interface Keyword {
  /** 必须与题干原文完全一致，用于在题干里定位并高亮 */
  text: string
  /** 为什么它是关键信息 —— 讲给孩子听 */
  reason: string
  /** 这一类关键信息的作用，用于归类建议 */
  role?: KeywordRole
}

/** 关键信息的角色，决定给出哪一类读题建议 */
export type KeywordRole =
  | 'task' // 题目要求做什么（概括 / 求面积 / 判断正误）
  | 'object' // 对象是谁 / 哪一部分（第三自然段 / 图书馆）
  | 'data' // 已知数据、单位
  | 'condition' // 限制条件（最多 / 至少 / 剪去）
  | 'target' // 最终要问的东西（一共多少元 / 还剩多少厘米）
  | 'trap' // 容易看漏的陷阱词（单位不统一 / 否定词）

/** 题目核心意思的一个选项 */
export interface Option {
  /** 对"这道题在问什么"的表述 */
  text: string
  correct: boolean
  /** 为什么对 / 为什么错 —— 讲给孩子听 */
  analysis: string
}

/** 题型（专项训练的维度） */
export interface Category {
  id: string
  subject: Subject
  name: string
  /** 一句话说明这个题型在考什么 */
  desc: string
}

/** 一道题 */
export interface Question {
  id: string
  subject: Subject
  /** 所属题型（对应 Category.id） */
  category: string
  grade: string
  /** 1 基础 · 2 进阶 · 3 挑战 */
  difficulty: 1 | 2 | 3
  /** 题干原文。关键词通过 indexOf 在其中定位 */
  stem: string
  keywords: Keyword[]
  /** 4 个选项，恰好 1 个 correct: true */
  options: Option[]
  /** 一句话解题提示 */
  tip: string
  /** 来源：内置题库 or AI 实时生成 */
  source?: 'bank' | 'ai'
}

/** 题干切分后的可点击片段 */
export interface Token {
  text: string
  /** 是否是题目认定的关键信息 */
  key: boolean
  reason?: string
  role?: KeywordRole
  /** 纯标点片段：不可点击，也不算作误选 */
  punct?: boolean
  index: number
}

/** 一次作答的批改结果 */
export interface Evaluation {
  optionCorrect: boolean
  /** 漏选的关键信息 */
  missed: Token[]
  /** 误选的非关键信息 */
  extra: Token[]
  hit: number
  totalKeys: number
  level: 'perfect' | 'good' | 'partial' | 'poor'
  headline: string
  advice: string[]
}
