import { BookX, Database, Settings as SettingsIcon } from 'lucide-react'
import { SUBJECTS } from '../types'
import type { Subject } from '../types'

interface Props {
  subject: Subject
  onSubject: (s: Subject) => void
  onOpenSettings: () => void
  onOpenBank: () => void
  onOpenMistakes: () => void
  aiConfigured: boolean
  todayAnswered: number
  dayStreak: number
  dueCount: number
}

export default function Header({
  subject,
  onSubject,
  onOpenSettings,
  onOpenBank,
  onOpenMistakes,
  aiConfigured,
  todayAnswered,
  dayStreak,
  dueCount,
}: Props) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">关键点</span>
        <span className="brand-sub">读懂每一道题</span>
      </div>

      <nav className="tabs" aria-label="学科">
        {SUBJECTS.map((s) => (
          <button
            type="button"
            key={s.id}
            className={`tab ${subject === s.id ? 'on' : ''}`}
            onClick={() => onSubject(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="topbar-right">
        <div className="score" title="今天做了多少题">
          <b>{todayAnswered}</b>
          <span>今日</span>
        </div>
        <div className="score" title="连续打卡天数">
          <b>{dayStreak}</b>
          <span>连续</span>
        </div>
        <button
          type="button"
          className={`icon-btn ${dueCount > 0 ? 'has-badge' : ''}`}
          onClick={onOpenMistakes}
          aria-label="错题本"
          title={dueCount > 0 ? `错题本 · ${dueCount} 题待复习` : '错题本'}
        >
          <BookX size={18} />
          {dueCount > 0 && <span className="icon-badge">{dueCount > 99 ? '99+' : dueCount}</span>}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenBank}
          aria-label="生成题库"
          title="生成题库"
        >
          <Database size={18} />
        </button>
        <button
          type="button"
          className={`icon-btn ${aiConfigured ? 'ai-on' : ''}`}
          onClick={onOpenSettings}
          aria-label="AI 设置"
          title={aiConfigured ? 'AI 已接入' : '接入 AI'}
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </header>
  )
}
