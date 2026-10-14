import { useState } from 'react'
import { Loader2, MessageCircle, Send } from 'lucide-react'
import type { ChatTurn } from '../lib/ai'

interface Props {
  open: boolean
  onToggle: () => void
  messages: ChatTurn[]
  busy: boolean
  configured: boolean
  onSend: (text: string) => void
  onOpenSettings: () => void
}

/** 底部抽屉：孩子向 AI 老师提问 */
export default function ChatDock({
  open,
  onToggle,
  messages,
  busy,
  configured,
  onSend,
  onOpenSettings,
}: Props) {
  const [draft, setDraft] = useState('')

  const send = () => {
    const text = draft.trim()
    if (!text || busy) return
    onSend(text)
    setDraft('')
  }

  return (
    <div className={`chat-dock ${open ? 'open' : ''}`}>
      <button type="button" className="chat-toggle" onClick={onToggle}>
        <MessageCircle size={18} />
        <span>问问 AI 老师</span>
        <span className="chat-toggle-caret">{open ? '收起' : '展开'}</span>
      </button>

      {open && (
        <div className="chat-body">
          <div className="chat-scroll">
            {messages.length === 0 && (
              <p className="chat-empty">
                有哪里没读懂？直接问我吧，比如「这道题为什么问的是这个？」「‘最多’是什么意思？」
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="bubble assistant thinking">
                <Loader2 size={14} className="spin" /> 正在想…
              </div>
            )}
          </div>

          {configured ? (
            <div className="chat-input">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send()
                }}
                placeholder="写下你的问题…"
                disabled={busy}
              />
              <button type="button" className="btn primary" onClick={send} disabled={busy}>
                <Send size={16} />
              </button>
            </div>
          ) : (
            <div className="chat-input disabled">
              <span className="muted">还没接入 AI，</span>
              <button type="button" className="btn ghost" onClick={onOpenSettings}>
                去设置
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
