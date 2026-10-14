import type { GroupEvaluation, GroupResult, Question } from '../types'

/** 某一组的作答：选项下标集合 */
export type GroupSelection = Set<number>

/** 批改分组选择题 */
export function evaluateGroups(
  question: Question,
  selections: GroupSelection[],
): GroupEvaluation {
  const groups = question.groups ?? []
  const results: GroupResult[] = groups.map((g, gi) => {
    const picked = selections[gi] ?? new Set<number>()
    const answerSet = new Set(g.correct)
    const missed = g.correct.filter((i) => !picked.has(i)).map((i) => g.options[i])
    const wrong = [...picked].filter((i) => !answerSet.has(i)).map((i) => g.options[i])
    const correct = missed.length === 0 && wrong.length === 0
    return {
      label: g.label,
      correct,
      missed,
      wrong,
      answer: g.correct.map((i) => g.options[i]),
    }
  })

  const allCorrect = results.every((r) => r.correct)
  const wrongCount = results.filter((r) => !r.correct).length

  const headline = allCorrect
    ? '全对！判断得很准。'
    : wrongCount === 1
      ? '只差一处，再仔细看看。'
      : `有 ${wrongCount} 处没看准，我们逐条过一遍。`

  const advice: string[] = []
  results.forEach((r) => {
    if (r.correct) return
    const parts: string[] = []
    if (r.missed.length) parts.push(`漏了「${r.missed.join('」「')}」`)
    if (r.wrong.length) parts.push(`多选了「${r.wrong.join('」「')}」`)
    advice.push(`${r.label}：${parts.join('，')}。正确答案是「${r.answer.join('」「')}」。`)
  })
  if (allCorrect) advice.push('每一项都判断对了，说明你不只是读懂了字面，还看懂了结构。')
  if (question.tip) advice.push(`小提示：${question.tip}`)

  return { allCorrect, groups: results, headline, advice }
}
