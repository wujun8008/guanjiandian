import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, Sparkles, Trash2, X } from 'lucide-react'
import { categoriesBySubject } from '../data/curriculum'
import { generateQuestion } from '../lib/ai'
import { DIFFICULTY_LABEL, SUBJECTS } from '../types'
import type { Question, Subject } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  aiConfigured: boolean
  defaultSubject: Subject
  onOpenSettings: () => void
  genCount: number
  onGenerated: (qs: Question[]) => void
  onClear: () => void
}

/** 按《出题规范》批量生成题库，存到本机浏览器 */
export default function BankGen({
  open,
  onClose,
  aiConfigured,
  defaultSubject,
  onOpenSettings,
  genCount,
  onGenerated,
  onClear,
}: Props) {
  const [subject, setSubject] = useState<Subject>(defaultSubject)
  const [cats, setCats] = useState<Set<string>>(new Set())
  const [diffs, setDiffs] = useState<Set<number>>(new Set([1, 2]))
  const [per, setPer] = useState(1)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [doneMsg, setDoneMsg] = useState<string | null>(null)
  const cancelRef = useRef(false)

  const catList = useMemo(() => categoriesBySubject(subject), [subject])

  // 每次打开时重置
  useEffect(() => {
    if (!open) return
    setSubject(defaultSubject)
    setCats(new Set(categoriesBySubject(defaultSubject).map((c) => c.id)))
    setDiffs(new Set([1, 2]))
    setPer(1)
    setProgress({ done: 0, total: 0 })
    setDoneMsg(null)
    setRunning(false)
    cancelRef.current = false
  }, [open, defaultSubject])

  const changeSubject = (s: Subject) => {
    setSubject(s)
    setCats(new Set(categoriesBySubject(s).map((c) => c.id)))
  }

  const toggleCat = (id: string) =>
    setCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAllCats = () =>
    setCats((prev) =>
      prev.size === catList.length ? new Set() : new Set(catList.map((c) => c.id)),
    )
  const toggleDiff = (d: number) =>
    setDiffs((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })

  const tasks = useMemo(() => {
    const list: { cat: string; diff: number }[] = []
    for (const c of catList) {
      if (!cats.has(c.id)) continue
      for (const d of [1, 2, 3]) {
        if (!diffs.has(d)) continue
        for (let i = 0; i < per; i++) list.push({ cat: c.id, diff: d })
      }
    }
    return list
  }, [catList, cats, diffs, per])

  if (!open) return null

  const start = async () => {
    if (!aiConfigured) {
      onOpenSettings()
      return
    }
    if (running || tasks.length === 0) return

    setRunning(true)
    setDoneMsg(null)
    setProgress({ done: 0, total: tasks.length })
    cancelRef.current = false

    const collected: Question[] = []
    let errs = 0
    for (let i = 0; i < tasks.length; i++) {
      if (cancelRef.current) break
      setProgress({ done: i, total: tasks.length })
      try {
        const q = await generateQuestion(subject, tasks[i].diff as 1 | 2 | 3, tasks[i].cat)
        collected.push(q)
      } catch {
        errs++
      }
    }
    setProgress({ done: tasks.length, total: tasks.length })
    if (collected.length) onGenerated(collected)
    setDoneMsg(
      `已生成 ${collected.length} 题` +
        (errs ? `，${errs} 题失败（可再试）` : '') +
        (cancelRef.current ? '（已停止）' : ''),
    )
    setRunning(false)
  }

  const tooMany = tasks.length > 60

  return (
    <div className="modal-mask" onClick={running ? undefined : onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>生成题库</h2>
          <button type="button" className="icon-btn" onClick={onClose} disabled={running} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <p className="modal-note">
          按项目的《出题规范》（<code>docs/出题规范.md</code>）让 AI 批量出题，存在本机浏览器里，
          和内置题库合并使用。换个设备需要重新生成。
        </p>

        <div className="gen-field">
          <span className="gen-label">学科</span>
          <div className="gen-chips">
            {SUBJECTS.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`fchip ${subject === s.id ? 'on' : ''}`}
                onClick={() => changeSubject(s.id)}
                disabled={running}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="gen-field">
          <span className="gen-label">题型</span>
          <div className="gen-chips">
            <button
              type="button"
              className={`fchip ${cats.size === catList.length ? 'on' : ''}`}
              onClick={toggleAllCats}
              disabled={running}
            >
              全部
            </button>
            {catList.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`fchip ${cats.has(c.id) ? 'on' : ''}`}
                onClick={() => toggleCat(c.id)}
                disabled={running}
                title={c.desc}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="gen-field">
          <span className="gen-label">难度</span>
          <div className="gen-chips">
            {[1, 2, 3].map((d) => (
              <button
                type="button"
                key={d}
                className={`fchip ${diffs.has(d) ? 'on' : ''}`}
                onClick={() => toggleDiff(d)}
                disabled={running}
              >
                {DIFFICULTY_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="gen-field">
          <span className="gen-label">每组合</span>
          <div className="gen-chips">
            {[1, 2, 3].map((n) => (
              <button
                type="button"
                key={n}
                className={`fchip ${per === n ? 'on' : ''}`}
                onClick={() => setPer(n)}
                disabled={running}
              >
                {n} 题
              </button>
            ))}
          </div>
        </div>

        <div className="gen-summary">
          将生成 <b>{tasks.length}</b> 题
          <span className="muted">（{tasks.length} 次 AI 调用）</span>
          {tooMany && <span className="gen-warn"> — 有点多，建议一次别超过 60 题</span>}
        </div>

        {running ? (
          <div className="gen-progress">
            <div className="gen-bar">
              <div
                className="gen-bar-fill"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="gen-progress-row">
              <span className="loading">
                <Loader2 size={14} className="spin" /> 正在生成 {progress.done}/{progress.total}…
              </span>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => {
                  cancelRef.current = true
                }}
              >
                停止
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-actions">
            <button
              type="button"
              className="btn primary"
              onClick={start}
              disabled={tasks.length === 0 || !aiConfigured}
            >
              <Sparkles size={16} /> 开始生成
            </button>
          </div>
        )}

        {!aiConfigured && <p className="gen-warn">还没接入 AI，请先在「设置」里填 API Key。</p>}
        {doneMsg && (
          <p className="gen-done">
            <Check size={14} /> {doneMsg}
          </p>
        )}

        <div className="gen-footer">
          <span className="muted">本机已生成 {genCount} 题</span>
          {genCount > 0 && (
            <button type="button" className="btn ghost small" onClick={onClear} disabled={running}>
              <Trash2 size={14} /> 清空生成的题库
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
