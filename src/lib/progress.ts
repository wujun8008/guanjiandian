import type { Question } from '../types'

/**
 * 学习进度：按天记录 + 错题本 + 间隔重复（Leitner 盒子）。
 * 全部存在浏览器 localStorage 里，刷新不丢。
 */

const KEY = 'guanjiandian.progress.v1'

export interface DayRecord {
  answered: number
  /** 核心意思选对的题数 */
  correct: number
  /** 完全读对（意思对 + 关键词没漏）的题数 */
  mastered: number
}

export interface Mistake {
  id: string
  /** 题目快照（复习时直接出这道题） */
  question: Question
  /** 做错次数 */
  wrong: number
  /** 连续订正对次数 */
  streak: number
  /** 盒子等级 1..MAX_BOX，越大越熟 */
  box: number
  /** 下次该复习的时间戳 */
  dueAt: number
  lastAt: number
}

export interface Progress {
  days: Record<string, DayRecord>
  mistakes: Mistake[]
  /** 累计"已掌握"（订正到出盒子）的题数 */
  masteredCount: number
  /** 复习相关累计 */
  reviewTotal: number
  reviewCorrect: number
}

const EMPTY: Progress = {
  days: {},
  mistakes: [],
  masteredCount: 0,
  reviewTotal: 0,
  reviewCorrect: 0,
}

const MIN = 60 * 1000
const DAY = 24 * 60 * MIN

/** 盒子 1..5 对应的下次复习间隔 */
const BOX_MS = [0, 30 * MIN, DAY, 3 * DAY, 7 * DAY, 15 * DAY]
export const MAX_BOX = 5

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    const p = JSON.parse(raw) as Partial<Progress>
    return {
      days: p.days ?? {},
      mistakes: Array.isArray(p.mistakes) ? p.mistakes : [],
      masteredCount: p.masteredCount ?? 0,
      reviewTotal: p.reviewTotal ?? 0,
      reviewCorrect: p.reviewCorrect ?? 0,
    }
  } catch {
    return { ...EMPTY }
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** 本地日期键，如 2026-10-14 */
export function todayKey(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 连续打卡天数：今天没做也不算断（从昨天往前数） */
export function computeStreak(days: Record<string, DayRecord>, now = new Date()): number {
  const has = (dt: Date) => (days[todayKey(dt)]?.answered ?? 0) > 0
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!has(d)) {
    d.setDate(d.getDate() - 1)
    if (!has(d)) return 0
  }
  let streak = 0
  while (has(d)) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/** 到期该复习的错题（按到期时间升序） */
export function dueMistakes(p: Progress, now = Date.now()): Mistake[] {
  return p.mistakes.filter((m) => m.dueAt <= now).sort((a, b) => a.dueAt - b.dueAt)
}

/**
 * 记录一次作答，返回新的进度。
 * - 完全读对：若在错题本里，盒子 +1；过 MAX_BOX 即"已掌握"，移出错题本。
 * - 没完全读对：进错题本 / 归零到盒子 1。
 * @param outcome correct=选对了核心判断；mastered=完全读对（会推进错题本）
 */
export function applyAnswer(
  p: Progress,
  question: Question,
  outcome: { correct: boolean; mastered: boolean },
  now = Date.now(),
): Progress {
  const fullyCorrect = outcome.mastered
  const key = todayKey(new Date(now))
  const day = p.days[key] ?? { answered: 0, correct: 0, mastered: 0 }
  const days: Record<string, DayRecord> = {
    ...p.days,
    [key]: {
      answered: day.answered + 1,
      correct: day.correct + (outcome.correct ? 1 : 0),
      mastered: day.mastered + (fullyCorrect ? 1 : 0),
    },
  }

  const idx = p.mistakes.findIndex((m) => m.id === question.id)
  const wasReview = idx >= 0
  let mistakes = p.mistakes
  let masteredCount = p.masteredCount

  if (fullyCorrect) {
    if (idx >= 0) {
      const m = p.mistakes[idx]
      const box = m.box + 1
      if (box > MAX_BOX) {
        mistakes = p.mistakes.filter((_, i) => i !== idx)
        masteredCount += 1
      } else {
        mistakes = p.mistakes.map((x, i) =>
          i === idx ? { ...x, box, streak: x.streak + 1, dueAt: now + BOX_MS[box], lastAt: now } : x,
        )
      }
    }
  } else if (idx >= 0) {
    mistakes = p.mistakes.map((x, i) =>
      i === idx
        ? { ...x, wrong: x.wrong + 1, streak: 0, box: 1, dueAt: now + BOX_MS[1], lastAt: now }
        : x,
    )
  } else {
    mistakes = [
      ...p.mistakes,
      {
        id: question.id,
        question,
        wrong: 1,
        streak: 0,
        box: 1,
        dueAt: now + BOX_MS[1],
        lastAt: now,
      },
    ]
  }

  return {
    days,
    mistakes,
    masteredCount,
    reviewTotal: p.reviewTotal + (wasReview ? 1 : 0),
    reviewCorrect: p.reviewCorrect + (wasReview && fullyCorrect ? 1 : 0),
  }
}

/** 人类可读的"还有多久复习" */
export function dueLabel(m: Mistake, now = Date.now()): string {
  if (m.dueAt <= now) return '待复习'
  const diff = m.dueAt - now
  const mins = Math.round(diff / MIN)
  if (mins < 60) return `${Math.max(1, mins)} 分钟后`
  const hours = Math.round(diff / (60 * MIN))
  if (hours < 24) return `${hours} 小时后`
  return `${Math.round(diff / DAY)} 天后`
}
