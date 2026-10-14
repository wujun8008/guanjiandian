import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { DEFAULT_AI_CONFIG, loadAIConfig, saveAIConfig } from '../lib/ai'
import type { AIConfig } from '../lib/ai'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const PRESETS: { label: string; baseUrl: string; model: string }[] = [
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { label: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { label: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { label: 'Kimi', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
]

/** AI 设置：Base URL + API Key + 模型 */
export default function Settings({ open, onClose, onSaved }: Props) {
  const [cfg, setCfg] = useState<AIConfig>(DEFAULT_AI_CONFIG)

  useEffect(() => {
    if (open) setCfg(loadAIConfig())
  }, [open])

  if (!open) return null

  const save = () => {
    saveAIConfig(cfg)
    onSaved()
    onClose()
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>接入 AI</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>

        <p className="modal-note">
          填好下面三项，就能让 AI 实时出题、并回答孩子的提问。Key 只保存在这台设备的浏览器里，
          不会上传到任何别的地方。
        </p>

        <div className="preset-row">
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              className={`chip-btn ${
                cfg.baseUrl === p.baseUrl && cfg.model === p.model ? 'on' : ''
              }`}
              onClick={() => setCfg((c) => ({ ...c, baseUrl: p.baseUrl, model: p.model }))}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className="field">
          <span>接口地址（Base URL）</span>
          <input
            value={cfg.baseUrl}
            onChange={(e) => setCfg((c) => ({ ...c, baseUrl: e.target.value }))}
            placeholder="https://api.deepseek.com/v1"
            spellCheck={false}
          />
        </label>

        <label className="field">
          <span>API Key</span>
          <input
            type="password"
            value={cfg.apiKey}
            onChange={(e) => setCfg((c) => ({ ...c, apiKey: e.target.value }))}
            placeholder="sk-..."
            spellCheck={false}
          />
        </label>

        <label className="field">
          <span>模型名称</span>
          <input
            value={cfg.model}
            onChange={(e) => setCfg((c) => ({ ...c, model: e.target.value }))}
            placeholder="deepseek-chat"
            spellCheck={false}
          />
        </label>

        <div className="modal-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setCfg({ ...DEFAULT_AI_CONFIG, apiKey: '' })}
          >
            清空
          </button>
          <button type="button" className="btn primary" onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
