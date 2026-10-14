import type { Token } from '../types'

interface Props {
  tokens: Token[]
  selected: Set<number>
  submitted: boolean
  onToggle: (index: number) => void
  /** 有则渲染为不可点选的纯文本（分组题用） */
  plainText?: string
  /** 覆盖顶部提示语 */
  hint?: string
}

/** 题干本身 —— 普通题可点击划重点；分组题只读展示 */
export default function StemCard({ tokens, selected, submitted, onToggle, plainText, hint }: Props) {
  const isPlain = plainText !== undefined

  return (
    <section className="stem-card">
      <div className="stem-hint">
        {hint ??
          (submitted
            ? '这是题目的关键信息对照：'
            : '读一读题目，点一下，把关键信息划出来（可以多选）')}
      </div>

      {isPlain ? (
        <div className="stem stem-plain">{plainText}</div>
      ) : (
        <div className="stem" aria-label="题目原文">
          {tokens.map((t) => {
            if (t.punct) {
              return (
                <span key={t.index} className="tok-plain">
                  {t.text}
                </span>
              )
            }
            const isSel = selected.has(t.index)
            let cls = 'tok'
            if (isSel) cls += ' sel'
            if (submitted) {
              if (t.key && isSel) cls += ' hit'
              else if (t.key && !isSel) cls += ' missed'
              else if (!t.key && isSel) cls += ' false'
            }
            return (
              <button
                type="button"
                key={t.index}
                className={cls}
                onClick={() => onToggle(t.index)}
                disabled={submitted}
                aria-pressed={isSel}
              >
                {t.text}
              </button>
            )
          })}
        </div>
      )}

      {submitted && !isPlain && (
        <div className="stem-legend">
          <span className="lg lg-hit">划对的关键信息</span>
          <span className="lg lg-missed">漏掉的关键信息</span>
          <span className="lg lg-false">划错了（次要信息）</span>
        </div>
      )}
    </section>
  )
}
