import type { Question } from '../types'

/**
 * AI 生成的题库存在浏览器 localStorage 里，
 * 和内置题库合并后一起参与出题（按学科、题型、难度筛选）。
 */
const KEY = 'guanjiandian.bank.v1'

export function loadGenBank(): Question[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as Question[]) : []
  } catch {
    return []
  }
}

export function saveGenBank(questions: Question[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(questions))
  } catch {
    /* 存储不可用时忽略 */
  }
}

export function clearGenBank(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
