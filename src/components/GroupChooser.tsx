import type { SelectGroup } from '../types'

interface Props {
  groups: SelectGroup[]
  /** 每组已选项的下标集合 */
  selections: Set<number>[]
  submitted: boolean
  onToggle: (groupIndex: number, optionIndex: number) => void
}

/** 分组选择：选知识点（多选）/ 判断句型（分层单选） */
export default function GroupChooser({ groups, selections, submitted, onToggle }: Props) {
  return (
    <section className="options">
      {groups.map((g, gi) => {
        const picked = selections[gi] ?? new Set<number>()
        // 提交后只展开"正确答案 + 孩子选过的"这几项的解析，避免刷屏
        const shown = new Set<number>([...g.correct, ...picked])

        return (
          <div className="group" key={gi}>
            <h2 className="options-title">
              {g.label}
              <span className="group-hint">{g.multiple ? '多选' : '单选'}</span>
            </h2>
            <div className="group-opts">
              {g.options.map((opt, oi) => {
                const isPicked = picked.has(oi)
                const isCorrect = g.correct.includes(oi)
                let cls = 'gopt'
                if (!submitted && isPicked) cls += ' picked'
                if (submitted) {
                  if (isCorrect) cls += ' correct'
                  else if (isPicked) cls += ' wrong'
                  else cls += ' dim'
                }
                return (
                  <button
                    type="button"
                    key={oi}
                    className={cls}
                    onClick={() => onToggle(gi, oi)}
                    disabled={submitted}
                    aria-pressed={isPicked}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>

            {submitted && g.notes && (
              <ul className="group-notes">
                {g.options.map((opt, oi) => {
                  if (!shown.has(oi)) return null
                  const note = g.notes?.[oi]
                  if (!note) return null
                  const isCorrect = g.correct.includes(oi)
                  return (
                    <li key={oi} className={isCorrect ? 'ok' : 'no'}>
                      <b>{opt}</b>：{note}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </section>
  )
}
