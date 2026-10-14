import { shuffle } from '../data/questions'
import type { Question } from '../types'

/**
 * 展示前打乱选项，避免"正确答案总在第一个"的位置惯性。
 * - 4 选 1：打乱 options（correct 随选项对象一起走）
 * - 分组题：每组打乱 options，并同步重映射 correct / notes
 */
export function shuffleQuestion(q: Question): Question {
  if (q.groups?.length) {
    const groups = q.groups.map((g) => {
      const order = shuffle(g.options.map((_, i) => i))
      return {
        ...g,
        options: order.map((i) => g.options[i]),
        correct: g.correct
          .map((c) => order.indexOf(c))
          .sort((a, b) => a - b),
        notes: g.notes ? order.map((i) => g.notes![i]) : undefined,
      }
    })
    return { ...q, groups }
  }
  if (q.options && q.options.length > 1) {
    return { ...q, options: shuffle(q.options) }
  }
  return q
}
