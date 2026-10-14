import type { Option } from '../types'

interface Props {
  options: Option[]
  chosen: number | null
  submitted: boolean
  onChoose: (index: number) => void
}

const LETTERS = ['A', 'B', 'C', 'D']

/** 这道题到底在问什么？ 4 选 1 */
export default function Options({ options, chosen, submitted, onChoose }: Props) {
  return (
    <section className="options">
      <h2 className="options-title">这道题到底在问什么？</h2>
      <div className="option-list">
        {options.map((o, i) => {
          let cls = 'option'
          if (!submitted && chosen === i) cls += ' picked'
          if (submitted) {
            if (o.correct) cls += ' correct'
            else if (chosen === i) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button
              type="button"
              key={i}
              className={cls}
              onClick={() => onChoose(i)}
              disabled={submitted}
              aria-pressed={chosen === i}
            >
              <span className="option-badge">{LETTERS[i]}</span>
              <span className="option-body">
                <span className="option-text">{o.text}</span>
                {submitted && (o.correct || chosen === i) && (
                  <span className="option-analysis">{o.analysis}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
