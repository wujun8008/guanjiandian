import { Database, Settings as SettingsIcon } from 'lucide-react'
import { SUBJECTS } from '../types'
import type { Stats, Subject } from '../types'

interface Props {
  subject: Subject
  onSubject: (s: Subject) => void
  stats: Stats
  onOpenSettings: () => void
  onOpenBank: () => void
  aiConfigured: boolean
}

export default function Header({
  subject,
  onSubject,
  stats,
  onOpenSettings,
  onOpenBank,
  aiConfigured,
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
        <div className="score" title="答对题数 / 总题数">
          <b>
            {stats.correct}
            <i>/</i>
            {stats.answered}
          </b>
          <span>答对</span>
        </div>
        <div className="score" title="连续完全读对的次数">
          <b>{stats.streak}</b>
          <span>连对</span>
        </div>
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
