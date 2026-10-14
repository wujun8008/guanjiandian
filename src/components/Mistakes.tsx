import { BookX, Play, Trash2, X } from 'lucide-react'
import { categoryName } from '../data/curriculum'
import { DIFFICULTY_LABEL } from '../types'
import { dueLabel } from '../lib/progress'
import type { Progress } from '../lib/progress'

interface Props {
  open: boolean
  onClose: () => void
  progress: Progress
  dueCount: number
  dayStreak: number
  todayAnswered: number
  onStartReview: () => void
  onClear: () => void
}

/** 错题本：待复习 / 已掌握 / 逐题状态 */
export default function Mistakes({
  open,
  onClose,
  progress,
  dueCount,
  dayStreak,
  todayAnswered,
  onStartReview,
  onClear,
}: Props) {
  if (!open) return null

  const list = [...progress.mistakes].sort((a, b) => a.dueAt - b.dueAt)

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>错题本</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <p className="modal-note">
          没完全读对的题会进这里，按<b>间隔重复</b>安排复习：答对一次推进一格，连续答对到出格就算「掌握」。
        </p>

        <div className="mk-stats">
          <div className="mk-stat">
            <b>{dueCount}</b>
            <span>待复习</span>
          </div>
          <div className="mk-stat">
            <b>{progress.mistakes.length}</b>
            <span>错题本</span>
          </div>
          <div className="mk-stat">
            <b>{progress.masteredCount}</b>
            <span>已掌握</span>
          </div>
          <div className="mk-stat">
            <b>{dayStreak}</b>
            <span>连续天数</span>
          </div>
          <div className="mk-stat">
            <b>{todayAnswered}</b>
            <span>今日答题</span>
          </div>
        </div>

        <div className="mk-actions">
          <button
            type="button"
            className="btn primary"
            onClick={onStartReview}
            disabled={dueCount === 0}
          >
            <Play size={16} /> {dueCount > 0 ? `开始复习（${dueCount} 题）` : '暂时没有要复习的'}
          </button>
        </div>

        {list.length === 0 ? (
          <p className="mk-empty">
            <BookX size={16} /> 还没有错题，继续保持！
          </p>
        ) : (
          <ul className="mk-list">
            {list.map((m) => {
              const due = m.dueAt <= Date.now()
              return (
                <li key={m.id} className={`mk-item ${due ? 'due' : ''}`}>
                  <div className="mk-item-main">
                    <p className="mk-stem">{m.question.stem}</p>
                    <p className="mk-meta">
                      <span className="chip soft">{categoryName(m.question.category)}</span>
                      <span className="mk-diff">{DIFFICULTY_LABEL[m.question.difficulty]}</span>
                      <span className="mk-wrong">做错 {m.wrong} 次</span>
                      <span className="mk-box">格子 {m.box}/{5}</span>
                    </p>
                  </div>
                  <span className={`mk-status ${due ? 'due' : ''}`}>{dueLabel(m)}</span>
                </li>
              )
            })}
          </ul>
        )}

        {list.length > 0 && (
          <div className="gen-footer">
            <span className="muted">累计订正 {progress.reviewCorrect}/{progress.reviewTotal} 次读对</span>
            <button type="button" className="btn ghost small" onClick={onClear}>
              <Trash2 size={14} /> 清空错题本
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
