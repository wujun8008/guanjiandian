import { Check, Lightbulb, Loader2, Sparkles, X } from 'lucide-react'
import type { Evaluation, Question } from '../types'

interface Props {
  evaluation: Evaluation
  question: Question
  aiConfigured: boolean
  aiText: string | null
  aiBusy: boolean
  onAskAI: () => void
}

const LEVEL_TONE: Record<Evaluation['level'], string> = {
  perfect: 'good',
  good: 'good',
  partial: 'mid',
  poor: 'bad',
}

/** 批改结果与读题建议 */
export default function Feedback({
  evaluation: ev,
  question,
  aiConfigured,
  aiText,
  aiBusy,
  onAskAI,
}: Props) {
  const tone = LEVEL_TONE[ev.level]
  const Icon = ev.optionCorrect ? Check : X

  return (
    <section className={`feedback tone-${tone}`}>
      <div className="feedback-head">
        <span className={`feedback-mark ${ev.optionCorrect ? 'ok' : 'no'}`}>
          <Icon size={20} strokeWidth={3} />
        </span>
        <div>
          <p className="feedback-headline">{ev.headline}</p>
          <p className="feedback-sub">
            核心意思 {ev.optionCorrect ? '选对了' : '选错了'} · 关键信息{' '}
            {ev.hit}/{ev.totalKeys} 划到
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
          <button
            type="button"
            className="btn ghost"
            onClick={onAskAI}
            disabled={aiBusy}
          >
            {aiBusy ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <Sparkles size={16} />
            )}
            {aiBusy ? '老师正在看你的作答…' : '让 AI 老师再讲讲这道题'}
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

      <p className="feedback-tip">正确答案：{question.options.find((o) => o.correct)?.text}</p>
    </section>
  )
}
