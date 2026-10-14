import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, Sparkles, Trash2, X } from 'lucide-react'
import { categoriesBySubject } from '../data/curriculum'
import { generateQuestionSet } from '../lib/ai'
import type { GenSpec } from '../lib/ai'
import { DIFFICULTY_LABEL, SUBJECTS } from '../types'
import type { Question, Subject } from '../types'

/** 一次请求最多出几道（太多会被模型的输出长度截断） */
const MAX_BATCH = 6
/** 同时跑几条请求 */
const CONCURRENCY = 3

/** 把清单切成每批不超过 max 道 */
function chunkSpecs(specs: GenSpec[], max: number): GenSpec[][] {
  const chunks: GenSpec[][] = []
  let cur: GenSpec[] = []
  let n = 0
  for (const s of specs) {
    let rest = s.count
    while (rest > 0) {
      const take = Math.min(rest, max - n)
      cur.push({ ...s, count: take })
      n += take
      rest -= take
      if (n >= max) {
        chunks.push(cur)
        cur = []
        n = 0
      }
    }
  }
  if (cur.length) chunks.push(cur)
  return chunks
}

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
  const [firstErr, setFirstErr] = useState<string | null>(null)
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
    setFirstErr(null)
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

  const specs = useMemo<GenSpec[]>(() => {
    const list: GenSpec[] = []
    for (const c of catList) {
      if (!cats.has(c.id)) continue
      for (const d of [1, 2, 3]) {
        if (!diffs.has(d)) continue
        list.push({ category: c.id, difficulty: d as 1 | 2 | 3, count: per })
      }
    }
    return list
  }, [catList, cats, diffs, per])

  const total = useMemo(() => specs.reduce((n, s) => n + s.count, 0), [specs])
  const callCount = useMemo(() => chunkSpecs(specs, MAX_BATCH).length, [specs])

  if (!open) return null

  const start = async () => {
    if (!aiConfigured) {
      onOpenSettings()
      return
    }
    if (running || total === 0) return

    setRunning(true)
    setDoneMsg(null)
    setFirstErr(null)
    setProgress({ done: 0, total })
    cancelRef.current = false

    const chunks = chunkSpecs(specs, MAX_BATCH)
    const queue = [...chunks]
    const collected: Question[] = []
    let errs = 0
    let firstErrMsg: string | null = null
    let done = 0

    const worker = async () => {
      while (queue.length) {
        if (cancelRef.current) return
        const chunk = queue.shift()!
        const n = chunk.reduce((a, s) => a + s.count, 0)
        try {
          const qs = await generateQuestionSet(subject, chunk)
          collected.push(...qs)
          if (qs.length < n) errs += n - qs.length
        } catch (e) {
          errs += n
          if (!firstErrMsg) firstErrMsg = e instanceof Error ? e.message : String(e)
        } finally {
          done += n
          setProgress({ done: Math.min(done, total), total })
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, () => worker()),
    )

    setProgress({ done: total, total })
    if (collected.length) onGenerated(collected)
    setFirstErr(firstErrMsg)
    setDoneMsg(
      `已生成 ${collected.length} 题` +
        (errs ? `，${errs} 题没拿到` : '') +
        (cancelRef.current ? '（已停止）' : ''),
    )
    setRunning(false)
  }

  const tooMany = total > 60

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
          将生成 <b>{total}</b> 题
          <span className="muted">
            （约 {callCount} 次请求，{Math.min(CONCURRENCY, callCount)} 条并行）
          </span>
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
              disabled={total === 0 || !aiConfigured}
            >
              <Sparkles size={16} /> 开始生成
            </button>
          </div>
        )}

        {!aiConfigured && <p className="gen-warn">还没接入 AI，请先在「设置」里填 API Key。</p>}
        {doneMsg && (
          <p className={`gen-done ${firstErr ? 'warn' : ''}`}>
            {!firstErr && <Check size={14} />} {doneMsg}
          </p>
        )}
        {firstErr && (
          <p className="gen-err">
            失败原因：{firstErr}
            <br />
            <span className="muted">可先去「设置」里点「测试连接」确认接口通不通。</span>
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
