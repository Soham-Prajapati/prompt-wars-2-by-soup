import { useEffect, useState } from 'react'
import { factCheck, trackEvent } from '../api'

const VERDICT_CONFIG = {
  VERIFIED:     { icon: 'VT', label: 'Verified True',  color: 'var(--verified)',     bg: 'var(--verified-bg)'     },
  FALSE:        { icon: 'FL', label: 'False',          color: 'var(--false)',        bg: 'var(--false-bg)'        },
  MISLEADING:   { icon: 'MS', label: 'Misleading',     color: 'var(--misleading)',   bg: 'var(--misleading-bg)'   },
  UNVERIFIABLE: { icon: 'UV', label: 'Unverifiable',   color: 'var(--unverifiable)', bg: 'var(--unverifiable-bg)' },
  SATIRE:       { icon: 'ST', label: 'Satire',         color: '#1A6BB5',             bg: '#E8F2FD'               },
}

const EXAMPLES = [
  'EVMs can be hacked via Bluetooth',
  'You can vote without voter ID using Aadhaar',
  'NOTA victory means election is re-held',
  "India's voting age was always 18",
]

export default function FactCheckPage() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    trackEvent('page_view', { page: 'fact-check' })
  }, [])

  const check = async (claim = text) => {
    if (!claim.trim() || loading) return
    trackEvent('factcheck_submitted', { claim_len: claim.length })
    setText(claim)
    setLoading(true); setResult(null); setError(null)
    try {
      const response = await factCheck(claim)
      trackEvent('factcheck_result_viewed', { overall_verdict: response?.overall_verdict || 'UNKNOWN', confidence: response?.confidence || 'UNKNOWN' })
      setResult(response)
    }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const vc = result ? (VERDICT_CONFIG[result.overall_verdict] || VERDICT_CONFIG.UNVERIFIABLE) : null

  return (
    <div className="home-page fact-layout">

      {/* Header */}
      <div className="card fact-header">
        <h1 className="section-title">Election Fact Checker</h1>
        <p className="section-subtitle">
          Got a WhatsApp forward or news claim? Paste it here. Gemini AI cross-checks against ECI official data.
        </p>
      </div>

      {/* Input card */}
      <div className="card panel-pad">
        <label htmlFor="factcheck-claim" style={{ display: 'block', fontWeight: 700, color: 'var(--navy)', marginBottom: 8, fontSize: 'var(--size-base)' }}>
          Paste a claim or forward:
        </label>
        <textarea
          id="factcheck-claim"
          className="input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. 'EVMs were hacked in the 2024 election' or 'Voter ID is not required if you have Aadhaar'..."
          style={{ minHeight: 100, marginBottom: 14 }}
        />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => check()} disabled={loading || !text.trim()} style={{ minWidth: 180, justifyContent: 'center' }}>
            {loading ? 'Analysing...' : 'Verify this claim'}
          </button>
          <span style={{ color: 'var(--ink-light)', fontSize: 'var(--size-sm)' }}>Examples:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => check(ex)} style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border)', background: 'var(--surface-3)',
              color: 'var(--ink-mid)', fontSize: 'var(--size-xs)', cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'var(--transition)',
            }}>{ex.substring(0, 40)}…</button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
          <p style={{ color: 'var(--ink-mid)' }}>Cross-referencing with ECI database and Gemini AI…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ padding: 18, borderColor: 'var(--false)', background: 'var(--false-bg)' }}>
          <p style={{ color: 'var(--false)', fontWeight: 600 }}>Issue: {error}</p>
          <p style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', marginTop: 4 }}>
            The AI service may not be configured yet. Try after deployment with GEMINI_API_KEY.
          </p>
        </div>
      )}

      {/* Result */}
      {result && vc && (
        <div className="fade-in">

          {/* Main verdict */}
          <div className="card" style={{ padding: '22px 24px', marginBottom: 16, borderColor: vc.color, borderWidth: 2, background: vc.bg }}>
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', flexShrink: 0, padding: '6px 8px', border: `1px solid ${vc.color}`, borderRadius: 8, color: vc.color }}>{vc.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span className="badge" style={{ color: vc.color, fontSize: 'var(--size-sm)', padding: '5px 14px', fontWeight: 700 }}>
                    {vc.label}
                  </span>
                  <span className="pill pill-inactive" style={{ fontSize: 12 }}>
                    Confidence: {result.confidence}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 'var(--size-base)', color: 'var(--navy)', marginBottom: 4 }}>
                  {result.summary}
                </p>
                <p style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', lineHeight: 1.65 }}>
                  {result.overall_explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Claim breakdown */}
          {result.claims?.length > 0 && (
            <div className="card" style={{ padding: '18px 22px', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 14, fontSize: 'var(--size-base)' }}>
                Claim-by-claim breakdown
              </div>
              {result.claims.map((c, i) => {
                const cv = VERDICT_CONFIG[c.verdict] || VERDICT_CONFIG.UNVERIFIABLE
                const detailsId = `claim-details-${i}`
                return (
                  <div key={i} style={{ borderBottom: i < result.claims.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: 12, marginBottom: 12 }}>
                    <button
                      type="button"
                      style={{
                        display: 'flex',
                        gap: 10,
                        cursor: 'pointer',
                        alignItems: 'flex-start',
                        width: '100%',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        padding: 0,
                      }}
                      onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))}
                      aria-expanded={Boolean(expanded[i])}
                      aria-controls={detailsId}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{cv.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 'var(--size-sm)', fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{c.claim}</p>
                        <span className="badge" style={{ color: cv.color, fontSize: 11 }}>{cv.label}</span>
                      </div>
                      <span style={{ color: 'var(--ink-light)', fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                        {expanded[i] ? '▲ hide' : '▼ details'}
                      </span>
                    </button>
                    {expanded[i] && (
                      <div id={detailsId} style={{ marginTop: 10, paddingLeft: 28 }}>
                        <p style={{ fontSize: 'var(--size-sm)', color: 'var(--ink-mid)', lineHeight: 1.65, marginBottom: 6 }}>{c.explanation}</p>
                        {c.source && (
                          <span className="pill pill-inactive" style={{ fontSize: 11 }}>{c.source}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Sources */}
          {result.sources_consulted?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="section-label">Sources consulted:</span>
              {result.sources_consulted.map((s, i) => (
                <span key={i} className="pill pill-inactive" style={{ fontSize: 11 }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
