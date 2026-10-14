import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import StemCard from './components/StemCard'
import Options from './components/Options'
import Feedback from './components/Feedback'
import ChatDock from './components/ChatDock'
import Settings from './components/Settings'
import BankGen from './components/BankGen'
import { bankBySubject, shuffle } from './data/questions'
import { categoriesBySubject, categoryName } from './data/curriculum'
import { tokenize } from './lib/tokenize'
import { evaluate } from './lib/feedback'
import { askTutor, explainMistake, generateQuestion, isAIConfigured } from './lib/ai'
import { clearGenBank, loadGenBank, saveGenBank } from './lib/store'
import type { ChatTurn } from './lib/ai'
import { DIFFICULTY_LABEL, emptyStats } from './types'
import type { CatStat } from './components/FilterBar'
import type { Evaluation, Question, Stats, Subject } from './types'

const SUBJECT_LABEL: Record<Subject, string> = { chinese: '语文', math: '数学', english: '英语' }

export default function App() {
  const [subject, setSubject] = useState<Subject>('chinese')
  const [category, setCategory] = useState<string>('all')
  const [diffFilter, setDiffFilter] = useState<number>(0)

  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [chosen, setChosen] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [catStats, setCatStats] = useState<Record<string, CatStat>>({})

  const [loadingQ, setLoadingQ] = useState(false)
  const [qError, setQError] = useState<string | null>(null)

  const [aiOn, setAiOn] = useState(isAIConfigured)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [genBank, setGenBank] = useState<Question[]>(() => loadGenBank())

  const [aiText, setAiText] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsgs, setChatMsgs] = useState<ChatTurn[]>([])
  const [chatBusy, setChatBusy] = useState(false)

  const queues = useRef<Map<string, Question[]>>(new Map())

  // 生成题库用 ref 读取，避免题库变化时重建出题函数、打断当前题目
  const genBankRef = useRef<Question[]>(genBank)
  useEffect(() => {
    genBankRef.current = genBank
    queues.current.clear() // 题库变了，清队列，下次出题用上新题
  }, [genBank])

  const tokens = useMemo(
    () => (question ? tokenize(question.stem, question.keywords) : []),
    [question],
  )

  const availableDiffs = useMemo(() => {
    const all = [...bankBySubject(subject), ...genBank.filter((q) => q.subject === subject)]
    const s = new Set(all.map((q) => q.difficulty))
    return Array.from(s).sort((a, b) => a - b)
  }, [subject, genBank])

  const resetRound = useCallback(() => {
    setSelected(new Set())
    setChosen(null)
    setSubmitted(false)
    setEvaluation(null)
    setAiText(null)
  }, [])

  // 内置题库 + 本机生成的题库
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
      setQuestion(map.get(key)!.pop() ?? null)
      resetRound()
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
        setQuestion(q)
        resetRound()
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
    loadFromBank(subject, category, diffFilter)
    setChatMsgs([])
  }, [subject, category, diffFilter, loadFromBank])

  const changeSubject = (s: Subject) => {
    setSubject(s)
    setCategory('all')
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

  const choose = (i: number) => {
    if (!submitted) setChosen(i)
  }

  const submit = () => {
    if (!question || chosen === null || submitted) return
    const ev = evaluate(question, tokens, selected, chosen)
    setEvaluation(ev)
    setSubmitted(true)
    const success = ev.optionCorrect && ev.missed.length === 0
    setStats((s) => {
      const streak = success ? s.streak + 1 : 0
      return {
        answered: s.answered + 1,
        correct: s.correct + (ev.optionCorrect ? 1 : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
      }
    })
    setCatStats((prev) => {
      const cur = prev[question.category] ?? { a: 0, c: 0 }
      return {
        ...prev,
        [question.category]: { a: cur.a + 1, c: cur.c + (ev.optionCorrect ? 1 : 0) },
      }
    })
  }

  const retry = () => resetRound()
  const next = () => loadFromBank(subject, category, diffFilter)

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

  const askAI = async () => {
    if (!question || !evaluation) return
    if (!isAIConfigured()) {
      setSettingsOpen(true)
      return
    }
    setAiBusy(true)
    try {
      const chosenText = chosen !== null ? question.options[chosen].text : ''
      const text = await explainMistake(
        question,
        evaluation.missed.map((m) => m.text),
        chosenText,
      )
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
        stats={stats}
        aiConfigured={aiOn}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenBank={() => setBankOpen(true)}
      />

      <main className="sheet">
        <FilterBar
          subject={subject}
          category={category}
          onCategory={setCategory}
          difficulty={diffFilter}
          onDifficulty={setDiffFilter}
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
              <span className="sheet-step">① 划重点　② 选意思</span>
            </div>

            <StemCard
              tokens={tokens}
              selected={selected}
              submitted={submitted}
              onToggle={toggleToken}
            />

            <Options
              options={question.options}
              chosen={chosen}
              submitted={submitted}
              onChoose={choose}
            />

            <div className="actions">
              {!submitted ? (
                <>
                  <button
                    type="button"
                    className="btn primary big"
                    onClick={submit}
                    disabled={chosen === null || loadingQ}
                  >
                    我读懂了，看结果
                  </button>
                  <button type="button" className="btn ghost" onClick={next} disabled={loadingQ}>
                    <RefreshCw size={16} /> 换一题
                  </button>
                  {aiOn && (
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
                    下一题
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

            {submitted && evaluation && (
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
    </div>
  )
}
