import { categoriesBySubject } from '../data/curriculum'
import { DIFFICULTY_LABEL } from '../types'
import type { Subject } from '../types'

export interface CatStat {
  a: number // 作答数
  c: number // 选对核心意思的题数
}

interface Props {
  subject: Subject
  category: string // 'all' 或 Category.id
  onCategory: (id: string) => void
  difficulty: number // 0 = 全部
  onDifficulty: (d: number) => void
  availableDiffs: number[]
  catStats: Record<string, CatStat>
}

/** 专项训练 + 难度筛选 */
export default function FilterBar({
  subject,
  category,
  onCategory,
  difficulty,
  onDifficulty,
  availableDiffs,
  catStats,
}: Props) {
  const cats = categoriesBySubject(subject)

  return (
    <section className="trainbar">
      <div className="train-row">
        <span className="train-label">专项训练</span>
        <div className="train-chips">
          <button
            type="button"
            className={`fchip ${category === 'all' ? 'on' : ''}`}
            onClick={() => onCategory('all')}
          >
            综合
          </button>
          {cats.map((c) => {
            const st = catStats[c.id]
            return (
              <button
                type="button"
                key={c.id}
                className={`fchip ${category === c.id ? 'on' : ''}`}
                onClick={() => onCategory(c.id)}
                title={c.desc}
              >
                {c.name}
                {st && st.a > 0 && (
                  <span className="fchip-stat">
                    {st.c}/{st.a}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="train-row">
        <span className="train-label">难度</span>
        <div className="seg">
          <button
            type="button"
            className={`seg-btn ${difficulty === 0 ? 'on' : ''}`}
            onClick={() => onDifficulty(0)}
          >
            全部
          </button>
          {availableDiffs.map((d) => (
            <button
              type="button"
              key={d}
              className={`seg-btn ${difficulty === d ? 'on' : ''}`}
              onClick={() => onDifficulty(d)}
            >
              {DIFFICULTY_LABEL[d]}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
