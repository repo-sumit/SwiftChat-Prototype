// KnowledgeCanvas — opened from a citation chip in the AI answer card.
//
// Fetches the raw markdown from the SwiftChat AI backend
//   GET ${VITE_SWIFTCHAT_AI_API_URL}/rag/knowledge/<source>
// renders it with a tiny inline parser, scrolls to the cited section, and
// gives that section a soft yellow highlight so the user can verify the
// answer against the source-of-truth.
//
// Failure modes:
//  - VITE_SWIFTCHAT_AI_API_URL not set → polite "configure backend" notice.
//  - Backend down / 404 / 500 → readable error with retry button.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, FileText, RefreshCw, ExternalLink } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const FONT = 'Montserrat, sans-serif'
const C = {
  textPrimary: '#0E0E0E', textSecondary: '#7383A5', textTertiary: '#828996',
  borderDefault: '#D5D8DF', borderSubtle: '#ECECEC',
  surface: '#FFFFFF', surfaceTint: '#F7F8FF',
  brand: '#386AF6', brandSubtle: '#EEF2FF', brandSubdued: '#345CCC',
  highlightBg: '#FFF8C5',                     // soft yellow for the cited section
  highlightBorder: '#FACC15',
  warning: '#F8B200', warningText: '#9A6500', warningSubtle: '#FDE1AC',
  error: '#EB5757', errorText: '#C0392B', errorSubtle: '#FDEAEA',
}

// ─── Tiny markdown → React renderer ──────────────────────────────────────
// Handles: # h1, ## h2, ### h3, **bold**, *italic*, `code`, - bullets,
// fenced ``` blocks, pipe-tables, paragraphs. Each ## h2 gets a slug id so
// we can scroll/highlight by section name.
function slugify(s) {
  return String(s).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}

function inlineFmt(text, key = 0) {
  // Replace inline patterns one by one, returning React fragments.
  const out = []
  let buf = String(text)
  // `code` first (so we don't apply bold/italic inside)
  const re = /(`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g
  let lastIdx = 0
  let m
  let i = 0
  while ((m = re.exec(buf)) !== null) {
    if (m.index > lastIdx) out.push(buf.slice(lastIdx, m.index))
    if (m[2]) out.push(<code key={`${key}-c-${i++}`} style={{
      background: C.surfaceTint, color: C.brandSubdued,
      padding: '1px 5px', borderRadius: 4, fontFamily: 'SFMono-Regular,Menlo,monospace', fontSize: '0.92em',
    }}>{m[2]}</code>)
    else if (m[3]) out.push(<strong key={`${key}-b-${i++}`} style={{ fontWeight: 700 }}>{m[3]}</strong>)
    else if (m[4]) out.push(<em key={`${key}-i-${i++}`}>{m[4]}</em>)
    lastIdx = m.index + m[0].length
  }
  if (lastIdx < buf.length) out.push(buf.slice(lastIdx))
  return out.length === 1 ? out[0] : out
}

function renderMarkdown(md, { activeSectionSlug } = {}) {
  if (!md) return null
  const lines = md.split(/\r?\n/)
  const blocks = []
  let i = 0
  let key = 0
  let currentSection = null     // accumulating block grouped under last h2
  const flushSection = () => {
    if (!currentSection) return
    const isActive = currentSection.slug === activeSectionSlug
    blocks.push(
      <section
        key={`s-${key++}`}
        id={'sec-' + currentSection.slug}
        data-active={isActive ? 'true' : 'false'}
        style={{
          margin: '8px 0 16px',
          padding: isActive ? '12px 14px' : 0,
          borderRadius: isActive ? 10 : 0,
          background: isActive ? C.highlightBg : 'transparent',
          border: isActive ? `1px solid ${C.highlightBorder}` : 'none',
        }}
      >
        {currentSection.children}
      </section>
    )
    currentSection = null
  }
  const pushIntoCurrent = (node) => {
    if (currentSection) currentSection.children.push(node)
    else blocks.push(node)
  }

  while (i < lines.length) {
    const line = lines[i]
    // Blank line — paragraph separator, just skip
    if (/^\s*$/.test(line)) { i++; continue }

    // h1
    if (/^#\s+/.test(line)) {
      flushSection()
      const text = line.replace(/^#\s+/, '').trim()
      blocks.push(
        <h1 key={`h1-${key++}`} style={{
          fontFamily: FONT, fontSize: 22, fontWeight: 700, lineHeight: '28px',
          color: C.textPrimary, letterSpacing: '-0.4px', margin: '8px 0 12px',
        }}>{inlineFmt(text, key)}</h1>
      )
      i++
      continue
    }
    // h2
    if (/^##\s+/.test(line)) {
      flushSection()
      const text = line.replace(/^##\s+/, '').trim()
      const slug = slugify(text)
      currentSection = {
        slug,
        children: [
          <h2 key={`h2-${key++}`} style={{
            fontFamily: FONT, fontSize: 16, fontWeight: 700, lineHeight: '22px',
            color: C.textPrimary, letterSpacing: '-0.2px', margin: '14px 0 8px',
          }}>{inlineFmt(text, key)}</h2>
        ],
      }
      i++
      continue
    }
    // h3
    if (/^###\s+/.test(line)) {
      const text = line.replace(/^###\s+/, '').trim()
      pushIntoCurrent(
        <h3 key={`h3-${key++}`} style={{
          fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.textPrimary,
          letterSpacing: '0.1px', margin: '12px 0 6px', textTransform: 'uppercase',
        }}>{inlineFmt(text, key)}</h3>
      )
      i++
      continue
    }
    // Fenced code block
    if (/^```/.test(line)) {
      const codeLines = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++ }
      i++ // closing fence
      pushIntoCurrent(
        <pre key={`pre-${key++}`} style={{
          fontFamily: 'SFMono-Regular,Menlo,monospace', fontSize: 12, lineHeight: 1.55,
          background: C.surfaceTint, border: `1px solid ${C.borderSubtle}`,
          borderRadius: 8, padding: '10px 12px', overflowX: 'auto',
          color: C.textPrimary, whiteSpace: 'pre',
        }}>{codeLines.join('\n')}</pre>
      )
      continue
    }
    // Pipe table
    if (/^\s*\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s|:-]+\|\s*$/.test(lines[i + 1])) {
      const head = line.split('|').slice(1, -1).map(c => c.trim())
      i += 2
      const rows = []
      while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
        rows.push(lines[i].split('|').slice(1, -1).map(c => c.trim()))
        i++
      }
      pushIntoCurrent(
        <div key={`tbl-${key++}`} style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '8px 0 12px' }}>
          <table style={{
            borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 360,
            fontFamily: FONT, fontSize: 12,
            border: `1px solid ${C.borderDefault}`, borderRadius: 8, overflow: 'hidden',
          }}>
            <thead>
              <tr style={{ background: C.surfaceTint }}>
                {head.map((h, hi) => (
                  <th key={hi} style={{
                    textAlign: 'left', padding: '8px 10px', fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.3px', color: C.textTertiary, textTransform: 'uppercase',
                    borderBottom: `1px solid ${C.borderSubtle}`,
                  }}>{inlineFmt(h, hi)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci} style={{
                      padding: '8px 10px', color: C.textPrimary,
                      borderTop: ri > 0 ? `1px solid ${C.borderSubtle}` : 'none',
                    }}>{inlineFmt(c, ci)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }
    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      pushIntoCurrent(
        <ul key={`ul-${key++}`} style={{
          fontFamily: FONT, fontSize: 13, color: C.textPrimary, lineHeight: 1.6,
          margin: '6px 0 10px', paddingLeft: 22,
        }}>
          {items.map((it, ii) => <li key={ii} style={{ margin: '2px 0' }}>{inlineFmt(it, ii)}</li>)}
        </ul>
      )
      continue
    }
    // Default: paragraph (greedy until blank line / heading / list / table)
    const para = [line]
    i++
    while (i < lines.length && !/^\s*$/.test(lines[i])
           && !/^#{1,3}\s+/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])
           && !/^```/.test(lines[i]) && !/^\s*\|.+\|\s*$/.test(lines[i])) {
      para.push(lines[i]); i++
    }
    pushIntoCurrent(
      <p key={`p-${key++}`} style={{
        fontFamily: FONT, fontSize: 13, color: C.textPrimary, lineHeight: 1.65,
        margin: '0 0 10px', overflowWrap: 'anywhere', wordBreak: 'break-word',
      }}>{inlineFmt(para.join(' '), key)}</p>
    )
  }
  flushSection()
  return blocks
}

// Pretty filename: "namo_saraswati_policy.md" → "Namo Saraswati Policy"
function prettySource(src) {
  return String(src || '').replace(/\.md$/i, '').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function getApiUrl() {
  const v = (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SWIFTCHAT_AI_API_URL) || ''
  return String(v).trim() || null
}

export default function KnowledgeCanvas({ context }) {
  const { closeCanvas } = useApp()
  const source = context?.source || ''
  const section = context?.section || ''
  const sectionSlug = section ? slugify(section) : null

  const [state, setState] = useState({ loading: true, error: null, content: null })
  const containerRef = useRef(null)

  useEffect(() => {
    const apiUrl = getApiUrl()
    if (!apiUrl) {
      setState({ loading: false, error: 'VITE_SWIFTCHAT_AI_API_URL is not configured. Citations need the SwiftChat AI backend running.', content: null })
      return
    }
    if (!source) {
      setState({ loading: false, error: 'No source specified.', content: null })
      return
    }
    setState({ loading: true, error: null, content: null })
    let cancelled = false
    fetch(apiUrl.replace(/\/$/, '') + '/rag/knowledge/' + encodeURIComponent(source))
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(j => {
        if (cancelled) return
        if (typeof j?.content !== 'string') throw new Error('malformed response')
        setState({ loading: false, error: null, content: j.content })
      })
      .catch(err => {
        if (cancelled) return
        setState({ loading: false, error: err?.message || 'fetch failed', content: null })
      })
    return () => { cancelled = true }
  }, [source])

  // After the markdown renders, scroll the highlighted section into view.
  useEffect(() => {
    if (!state.content || !sectionSlug) return
    const t = setTimeout(() => {
      const el = containerRef.current?.querySelector('#sec-' + CSS.escape(sectionSlug))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 60)
    return () => clearTimeout(t)
  }, [state.content, sectionSlug])

  const tree = useMemo(
    () => state.content ? renderMarkdown(state.content, { activeSectionSlug: sectionSlug }) : null,
    [state.content, sectionSlug]
  )

  const retry = () => setState({ loading: true, error: null, content: null })

  return (
    <div ref={containerRef} style={{ padding: 16, fontFamily: FONT, color: C.textPrimary, maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #F7F8FF 0%, #EEF2FF 100%)',
        border: `1px solid ${C.brandSubtle}`, borderRadius: 12,
        padding: '12px 14px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <FileText size={14} color={C.brand} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', color: C.brand, textTransform: 'uppercase' }}>
            SwiftChat Knowledge · Source
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: '20px', color: C.textPrimary, marginBottom: 2 }}>
          {prettySource(source)}
        </div>
        {section && (
          <div style={{ fontSize: 12, color: C.textSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📍</span>
            <span>Highlighted section · <strong>{section}</strong></span>
          </div>
        )}
      </div>

      {/* Body */}
      {state.loading && (
        <div style={{ padding: 24, textAlign: 'center', color: C.textTertiary, fontSize: 13 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div className="dot-pulse-1" style={{ width: 6, height: 6, borderRadius: 999, background: C.brand, opacity: 0.6 }} />
            <div className="dot-pulse-2" style={{ width: 6, height: 6, borderRadius: 999, background: C.brand, opacity: 0.6 }} />
            <div className="dot-pulse-3" style={{ width: 6, height: 6, borderRadius: 999, background: C.brand, opacity: 0.6 }} />
          </div>
          <div style={{ marginTop: 8 }}>Loading {prettySource(source)}…</div>
        </div>
      )}

      {state.error && (
        <div style={{
          background: C.errorSubtle, border: `1px solid ${C.error}`, borderRadius: 12,
          padding: 14, color: C.errorText, fontSize: 13, lineHeight: 1.5,
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Couldn't load this source</div>
            <div style={{ marginBottom: 10 }}>{state.error}</div>
            <button onClick={retry} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#fff', color: C.errorText, border: `1.5px solid ${C.error}`,
              borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT,
            }}>
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        </div>
      )}

      {state.content && (
        <article style={{ maxWidth: '100%', minWidth: 0, overflowWrap: 'anywhere' }}>
          {tree}
        </article>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.borderSubtle}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: 11, color: C.textTertiary, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ExternalLink size={11} /> {source}
        </div>
        <button onClick={closeCanvas} style={{
          background: '#fff', color: C.textSecondary, border: `1.5px solid ${C.borderDefault}`,
          borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
        }}>Close</button>
      </div>
    </div>
  )
}
