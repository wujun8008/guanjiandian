import { Check, Lightbulb, Loader2, Sparkles, X } from 'lucide-react'
import type { GroupEvaluation, Question } from '../types'

interface Props {
  evaluation: GroupEvaluation
  question: Question
  aiConfigured: boolean
  aiText: string | null
  aiBusy: boolean
  onAskAI: () => void
}

/** 分组选择题的批改结果 */
export default function GroupFeedback({
  evaluation: ev,
  question,
  aiConfigured,
  aiText,
  aiBusy,
  onAskAI,
}: Props) {
  const rightCount = ev.groups.filter((g) => g.correct).length

  return (
    <section className={`feedback tone-${ev.allCorrect ? 'good' : 'mid'}`}>
      <div className="feedback-head">
        <span className={`feedback-mark ${ev.allCorrect ? 'ok' : 'no'}`}>
          {ev.allCorrect ? <Check size={20} strokeWidth={3} /> : <X size={20} strokeWidth={3} />}
        </span>
        <div>
          <p className="feedback-headline">{ev.headline}</p>
          <p className="feedback-sub">
            {rightCount}/{ev.groups.length} 项判断正确
          </p>
        </div>
      </div>

      <ul className="advice">
        {ev.advice.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      <div className="feedback-ai">
        {!aiText && (
          <button type="button" className="btn ghost" onClick={onAskAI} disabled={aiBusy}>
            {aiBusy ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            {aiBusy ? '老师正在看你的作答…' : '让 AI 老师再讲讲'}
          </button>
        )}
        {!aiConfigured && !aiText && (
          <span className="muted">（需先在右上角设置里填 API Key）</span>
        )}
        {aiText && (
          <div className="ai-note">
            <Lightbulb size={16} />
            <p>{aiText}</p>
          </div>
        )}
      </div>

      <p className="feedback-tip">小提示：{question.tip}</p>
    </section>
  )
}
