import type { Token } from '../types'

interface Props {
  tokens: Token[]
  selected: Set<number>
  submitted: boolean
  onToggle: (index: number) => void
}

/** 题干本身 —— 可点击划重点的主角 */
export default function StemCard({ tokens, selected, submitted, onToggle }: Props) {
  return (
    <section className="stem-card">
      <div className="stem-hint">
        {submitted ? '这是题目的关键信息对照：' : '读一读题目，点一下，把关键信息划出来（可以多选）'}
      </div>

      <div className="stem" aria-label="题目原文">
        {tokens.map((t) => {
          // 纯标点不可点击，直接当普通文字渲染
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

      {submitted && (
        <div className="stem-legend">
          <span className="lg lg-hit">划对的关键信息</span>
          <span className="lg lg-missed">漏掉的关键信息</span>
          <span className="lg lg-false">划错了（次要信息）</span>
        </div>
      )}
    </section>
  )
}
