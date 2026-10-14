import type { Keyword, Token } from '../types'

/** 会被当作"一个片段结束"的标点（含中英文） */
const PUNCT = new Set(
  '，。、；：？！…—～·,.;:?!()（）【】《》〈〉「」『』“”‘’“”\'"_'.split(''),
)

/** 把没有关键词的普通文字，按标点切成自然的短语（标点跟随前一段） */
function splitFiller(text: string): string[] {
  const out: string[] = []
  let buf = ''
  for (const ch of text) {
    buf += ch
    if (PUNCT.has(ch)) {
      out.push(buf)
      buf = ''
    }
  }
  if (buf) out.push(buf)
  return out
}

/** 是否整段都是标点（这类片段不让孩子点选） */
function isPunctOnly(text: string): boolean {
  for (const ch of text) {
    if (!PUNCT.has(ch) && !/\s/.test(ch)) return false
  }
  return true
}

/**
 * 把题干切成可点击的片段。
 * 关键词（key=true）会从原文里被精确切出来；其余文字按标点切成普通片段。
 * 用 indexOf 取每处关键词的首次出现，重叠的自动丢弃。
 */
export function tokenize(stem: string, keywords: Keyword[]): Token[] {
  const spans: { start: number; end: number; kw: Keyword }[] = []
  for (const kw of keywords) {
    if (!kw.text) continue
    const start = stem.indexOf(kw.text)
    if (start >= 0) spans.push({ start, end: start + kw.text.length, kw })
  }
  spans.sort((a, b) => a.start - b.start)

  // 丢弃相互重叠的区间，保证不重复覆盖
  const chosen: typeof spans = []
  let lastEnd = -1
  for (const s of spans) {
    if (s.start >= lastEnd) {
      chosen.push(s)
      lastEnd = s.end
    }
  }

  const tokens: Token[] = []
  let cursor = 0
  let idx = 0

  const pushFiller = (text: string) => {
    for (const part of splitFiller(text)) {
      if (!part) continue
      tokens.push({ text: part, key: false, punct: isPunctOnly(part), index: idx++ })
    }
  }

  for (const s of chosen) {
    if (s.start > cursor) pushFiller(stem.slice(cursor, s.start))
    tokens.push({
      text: stem.slice(s.start, s.end),
      key: true,
      reason: s.kw.reason,
      role: s.kw.role,
      index: idx++,
    })
    cursor = s.end
  }
  if (cursor < stem.length) pushFiller(stem.slice(cursor))

  return tokens
}
