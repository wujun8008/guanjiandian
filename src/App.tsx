import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import StemCard from './components/StemCard'
import Options from './components/Options'
import GroupChooser from './components/GroupChooser'
import Feedback from './components/Feedback'
import GroupFeedback from './components/GroupFeedback'
import ChatDock from './components/ChatDock'
import Settings from './components/Settings'
import BankGen from './components/BankGen'
import Mistakes from './components/Mistakes'
import { bankBySubject, shuffle } from './data/questions'
import { categoriesBySubject, categoryName } from './data/curriculum'
import { tokenize } from './lib/tokenize'
import { evaluate } from './lib/feedback'
import { evaluateGroups } from './lib/groupFeedback'
import { shuffleQuestion } from './lib/present'
import { askTutor, explainMistake, generateQuestion, isAIConfigured } from './lib/ai'
import { clearGenBank, loadGenBank, saveGenBank } from './lib/store'
import {
  applyAnswer,
  computeStreak,
  dueMistakes,
  loadProgress,
  saveProgress,
  todayKey,
} from './lib/progress'
import type { Progress } from './lib/progress'
import type { ChatTurn } from './lib/ai'
import { DIFFICULTY_LABEL } from './types'
import type { CatStat } from './components/FilterBar'
import type { Evaluation, GroupEvaluation, Question, Subject } from './types'

const SUBJECT_LABEL: Record<Subject, string> = { chinese: '语文', math: '数学', english: '英语' }

export default function App() {
  const [subject, setSubject] = useState<Subject>('chinese')
  const [category, setCategory] = useState<string>('all')
  const [diffFilter, setDiffFilter] = useState<number>(0)

  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [chosen, setChosen] = useState<number | null>(null)
  const [groupSel, setGroupSel] = useState<Set<number>[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [groupEval, setGroupEval] = useState<GroupEvaluation | null>(null)
  const [catStats, setCatStats] = useState<Record<string, CatStat>>({})

  const [loadingQ, setLoadingQ] = useState(false)
  const [qError, setQError] = useState<string | null>(null)

  const [aiOn, setAiOn] = useState(isAIConfigured)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [mistakesOpen, setMistakesOpen] = useState(false)
  const [genBank, setGenBank] = useState<Question[]>(() => loadGenBank())

  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [reviewing, setReviewing] = useState(false)
  const [reviewQueue, setReviewQueue] = useState<Question[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)

  const [aiText, setAiText] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<ChatTurn[]>([])
  const [chatBusy, setChatBusy] = useState(false)

  const queues = useRef<Map<string, Question[]>>(new Map())

  const genBankRef = useRef<Question[]>(genBank)
  useEffect(() => {
    genBankRef.current = genBank
    queues.current.clear()
  }, [genBank])

  const isGroup = !!question?.groups?.length

  const tokens = useMemo(
    () => (question && !question.groups?.length ? tokenize(question.stem, question.keywords) : []),
    [question],
  )

  const availableDiffs = useMemo(() => {
    const all = [...bankBySubject(subject), ...genBank.filter((q) => q.subject === subject)]
    const s = new Set(all.map((q) => q.difficulty))
    return Array.from(s).sort((a, b) => a - b)
  }, [subject, genBank])

  const due = useMemo(() => dueMistakes(progress), [progress])
  const todayAnswered = progress.days[todayKey()]?.answered ?? 0
  const dayStreak = useMemo(() => computeStreak(progress.days), [progress.days])

  const resetRound = useCallback((q: Question | null) => {
    setSelected(new Set())
    setChosen(null)
    setGroupSel(q?.groups ? q.groups.map(() => new Set<number>()) : [])
    setSubmitted(false)
    setEvaluation(null)
    setGroupEval(null)
    setAiText(null)
  }, [])

  const buildPool = useCallback((s: Subject, cat: string, diff: number) => {
    let qs = [...bankBySubject(s), ...genBankRef.current.filter((q) => q.subject === s)]
    if (cat !== 'all') qs = qs.filter((q) => q.category === cat)
    if (diff !== 0) qs = qs.filter((q) => q.difficulty === diff)
    return qs
  }, [])

  const loadFromBank = useCallback(
    (s: Subject, cat: string, diff: number) => {
      const key = `${s}|${cat}|${diff}`
      const map = queues.current
      if (!map.has(key) || map.get(key)!.length === 0) {
        map.set(key, shuffle(buildPool(s, cat, diff)))
      }
      const q = map.get(key)!.pop() ?? null
      setQuestion(q ? shuffleQuestion(q) : null)
      resetRound(q)
    },
    [buildPool, resetRound],
  )

  const loadAIQuestion = useCallback(
    async (s: Subject, cat: string, diff: number) => {
      setLoadingQ(true)
      setQError(null)
      try {
        const d = (diff !== 0 ? diff : 1 + Math.floor(Math.random() * 3)) as 1 | 2 | 3
        const cats = categoriesBySubject(s)
        const catId = cat !== 'all' ? cat : cats[Math.floor(Math.random() * cats.length)].id
        const q = await generateQuestion(s, d, catId)
        setQuestion(shuffleQuestion(q))
        resetRound(q)
      } catch (e) {
        setQError(e instanceof Error ? e.message : 'AI 出题失败，已改用内置题库。')
        loadFromBank(s, cat, diff)
      } finally {
        setLoadingQ(false)
      }
    },
    [loadFromBank, resetRound],
  )

  useEffect(() => {
    if (reviewing) return
    loadFromBank(subject, category, diffFilter)
    setChatMsgs([])
  }, [subject, category, diffFilter, loadFromBank, reviewing])

  const exitReview = useCallback(() => {
    setReviewing(false)
    setReviewQueue([])
    setReviewIndex(0)
  }, [])

  const changeSubject = (s: Subject) => {
    exitReview()
    setSubject(s)
    setCategory('all')
  }
  const changeCategory = (c: string) => {
    exitReview()
    setCategory(c)
  }
  const changeDiff = (d: number) => {
    exitReview()
    setDiffFilter(d)
  }

  const toggleToken = (index: number) => {
    if (submitted) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleGroup = (gi: number, oi: number) => {
    if (submitted) return
    setGroupSel((prev) => {
      const g = question?.groups?.[gi]
      if (!g) return prev
      const next = prev.map((s) => new Set(s))
      if (!next[gi]) next[gi] = new Set<number>()
      if (g.multiple) {
        if (next[gi].has(oi)) next[gi].delete(oi)
        else next[gi].add(oi)
      } else {
        next[gi] = new Set([oi])
      }
      return next
    })
  }

  const choose = (i: number) => {
    if (!submitted) setChosen(i)
  }

  const canSubmit = isGroup
    ? groupSel.length === (question?.groups?.length ?? 0) && groupSel.every((s) => s.size > 0)
    : chosen !== null

  const submit = () => {
    if (!question || submitted || !canSubmit) return
    setSubmitted(true)

    if (question.groups?.length) {
      const gev = evaluateGroups(question, groupSel)
      setGroupEval(gev)
      setProgress((prev) => {
        const next = applyAnswer(prev, question, {
          correct: gev.allCorrect,
          mastered: gev.allCorrect,
        })
        saveProgress(next)
        return next
      })
      setCatStats((prev) => {
        const cur = prev[question.category] ?? { a: 0, c: 0 }
        return {
          ...prev,
          [question.category]: { a: cur.a + 1, c: cur.c + (gev.allCorrect ? 1 : 0) },
        }
      })
      return
    }

    if (chosen === null) return
    const ev = evaluate(question, tokens, selected, chosen)
    setEvaluation(ev)
    const mastered = ev.optionCorrect && ev.missed.length === 0
    setProgress((prev) => {
      const next = applyAnswer(prev, question, { correct: ev.optionCorrect, mastered })
      saveProgress(next)
      return next
    })
    setCatStats((prev) => {
      const cur = prev[question.category] ?? { a: 0, c: 0 }
      return {
        ...prev,
        [question.category]: { a: cur.a + 1, c: cur.c + (ev.optionCorrect ? 1 : 0) },
      }
    })
  }

  const retry = () => resetRound(question)

  const next = () => {
    if (reviewing) {
      const ni = reviewIndex + 1
      if (ni < reviewQueue.length) {
        setReviewIndex(ni)
        setQuestion(shuffleQuestion(reviewQueue[ni]))
        resetRound(reviewQueue[ni])
      } else {
        exitReview()
      }
      return
    }
    loadFromBank(subject, category, diffFilter)
  }

  const startReview = () => {
    const list = dueMistakes(progress).map((m) => m.question)
    if (!list.length) return
    const q = shuffle(list)
    setReviewQueue(q)
    setReviewIndex(0)
    setReviewing(true)
    setQuestion(shuffleQuestion(q[0]))
    resetRound(q[0])
    setMistakesOpen(false)
  }

  const onGenerated = (qs: Question[]) => {
    setGenBank((prev) => {
      const merged = [...prev, ...qs]
      saveGenBank(merged)
      return merged
    })
  }
  const onClearBank = () => {
    clearGenBank()
    setGenBank([])
  }
  const onClearMistakes = () => {
    setProgress((prev) => {
      const next = { ...prev, mistakes: [] }
      saveProgress(next)
      return next
    })
  }

  const askAI = async () => {
    if (!question || !submitted) return
    if (!isAIConfigured()) {
      setSettingsOpen(true)
      return
    }
    let detail = ''
    if (question.groups?.length && groupEval) {
      detail = groupEval.groups
        .filter((g) => !g.correct)
        .map((g) => `${g.label}判断有误（正确答案：${g.answer.join('、')}）`)
        .join('；')
      if (!detail) detail = '全部判断正确'
    } else if (evaluation) {
      const missed = evaluation.missed.map((m) => m.text).join('、')
      const picked = chosen !== null ? question.options[chosen]?.text : ''
      detail = `漏掉的关键信息：${missed || '（无）'}；选的意思：${picked}`
    }
    setAiBusy(true)
    try {
      const text = await explainMistake(question, detail)
      setAiText(text)
    } catch (e) {
      setAiText(e instanceof Error ? e.message : 'AI 暂时联系不上，请稍后再试。')
    } finally {
      setAiBusy(false)
    }
  }

  const sendChat = async (text: string) => {
    if (!isAIConfigured()) return
    const withUser: ChatTurn[] = [...chatMsgs, { role: 'user', content: text }]
    setChatMsgs(withUser)
    setChatBusy(true)
    try {
      const reply = await askTutor(question, chatMsgs, text)
      setChatMsgs([...withUser, { role: 'assistant', content: reply }])
    } catch (e) {
      setChatMsgs([
        ...withUser,
        { role: 'assistant', content: e instanceof Error ? e.message : 'AI 暂时联系不上。' },
      ])
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <div className="app">
      <Header
        subject={subject}
        onSubject={changeSubject}
        aiConfigured={aiOn}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBank={() => setBankOpen(true)}
        onOpenMistakes={() => setMistakesOpen(true)}
        todayAnswered={todayAnswered}
        dayStreak={dayStreak}
        dueCount={due.length}
      />

      <main className="sheet">
        <FilterBar
          subject={subject}
          category={category}
          onCategory={changeCategory}
          difficulty={diffFilter}
          onDifficulty={changeDiff}
          availableDiffs={availableDiffs}
          catStats={catStats}
        />

        {question ? (
          <>
            <div className="sheet-head">
              <span className="chip">{SUBJECT_LABEL[question.subject]}</span>
              <span className="chip soft">{categoryName(question.category)}</span>
              <span className="chip soft">{DIFFICULTY_LABEL[question.difficulty]}</span>
              {question.source === 'ai' && <span className="chip ai">AI 出题</span>}
              {reviewing ? (
                <span className="chip review">
                  错题复习 {reviewIndex + 1}/{reviewQueue.length}
                  <button
                    type="button"
                    className="chip-x"
                    onClick={exitReview}
                    aria-label="退出复习"
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span className="sheet-step">
                  {isGroup ? '读一读，选出正确的判断' : '① 划重点　② 选意思'}
                </span>
              )}
            </div>

            <StemCard
              tokens={tokens}
              selected={selected}
              submitted={submitted}
              onToggle={toggleToken}
              plainText={isGroup ? question.stem : undefined}
              hint={isGroup ? '读一读，再从下面选出正确的判断。' : undefined}
            />

            {isGroup ? (
              <GroupChooser
                groups={question.groups!}
                selections={groupSel}
                submitted={submitted}
                onToggle={toggleGroup}
              />
            ) : (
              <Options
                options={question.options}
                chosen={chosen}
                submitted={submitted}
                onChoose={choose}
              />
            )}

            <div className="actions">
              {!submitted ? (
                <>
                  <button
                    type="button"
                    className="btn primary big"
                    onClick={submit}
                    disabled={!canSubmit || loadingQ}
                  >
                    我读懂了，看结果
                  </button>
                  <button type="button" className="btn ghost" onClick={next} disabled={loadingQ}>
                    <RefreshCw size={16} /> {reviewing ? '跳过' : '换一题'}
                  </button>
                  {aiOn && !reviewing && (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => loadAIQuestion(subject, category, diffFilter)}
                      disabled={loadingQ}
                    >
                      <Sparkles size={16} /> AI 出题
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button type="button" className="btn primary big" onClick={next}>
                    {reviewing && reviewIndex + 1 >= reviewQueue.length ? '完成复习' : '下一题'}
                  </button>
                  <button type="button" className="btn ghost" onClick={retry}>
                    重做这题
                  </button>
                </>
              )}
            </div>

            {loadingQ && (
              <p className="loading">
                <Loader2 size={16} className="spin" /> AI 正在出题…
              </p>
            )}
            {qError && <p className="qerror">{qError}</p>}

            {submitted && isGroup && groupEval && (
              <GroupFeedback
                evaluation={groupEval}
                question={question}
                aiConfigured={aiOn}
                aiText={aiText}
                aiBusy={aiBusy}
                onAskAI={askAI}
              />
            )}
            {submitted && !isGroup && evaluation && (
              <Feedback
                evaluation={evaluation}
                question={question}
                aiConfigured={aiOn}
                aiText={aiText}
                aiBusy={aiBusy}
                onAskAI={askAI}
              />
            )}
          </>
        ) : (
          <p className="loading">正在准备题目…</p>
        )}
      </main>

      <ChatDock
        open={chatOpen}
        onToggle={() => setChatOpen((v) => !v)}
        messages={chatMsgs}
        busy={chatBusy}
        configured={aiOn}
        onSend={sendChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setAiOn(isAIConfigured())}
      />

      <BankGen
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        aiConfigured={aiOn}
        defaultSubject={subject}
        onOpenSettings={() => setSettingsOpen(true)}
        genCount={genBank.length}
        onGenerated={onGenerated}
        onClear={onClearBank}
      />

      <Mistakes
        open={mistakesOpen}
        onClose={() => setMistakesOpen(false)}
        progress={progress}
        dueCount={due.length}
        dayStreak={dayStreak}
        todayAnswered={todayAnswered}
        onStartReview={startReview}
        onClear={onClearMistakes}
      />
    </div>
  )
}
