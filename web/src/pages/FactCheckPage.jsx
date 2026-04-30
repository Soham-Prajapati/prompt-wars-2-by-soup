import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, CheckCircle2, AlertCircle, HelpCircle, FileText, ChevronDown, ChevronUp, Search, Landmark } from 'lucide-react'
import { factCheck, trackEvent } from '../api'

const VERDICT_CONFIG = {
  VERIFIED:     { icon: <CheckCircle2 size={20} />, label: 'Verified True',  color: 'var(--india-green)', bg: '#ECFDF5', border: '#10B981' },
  FALSE:        { icon: <AlertCircle size={20} />,  label: 'False',          color: '#EF4444',             bg: '#FEF2F2', border: '#EF4444' },
  MISLEADING:   { icon: <ShieldAlert size={20} />,  label: 'Misleading',     color: 'var(--eci-saffron)',  bg: '#FFF7ED', border: '#F97316' },
  UNVERIFIABLE: { icon: <HelpCircle size={20} />,   label: 'Unverifiable',   color: '#6366F1',             bg: '#EEF2FF', border: '#6366F1' },
  SATIRE:       { icon: <HelpCircle size={20} />,   label: 'Satire',         color: '#003366',             bg: '#F8FAFC', border: '#003366' },
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

  useEffect(() => { trackEvent('page_view', { page: 'fact-check' }) }, [])

  const check = async (claim = text) => {
    if (!claim.trim() || loading) return
    trackEvent('factcheck_submitted', { claim_len: claim.length })
    setText(claim); setLoading(true); setResult(null); setError(null)
    try {
      const response = await factCheck(claim)
      setResult(response)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="app-container" style={{ padding: '60px 0 100px' }}>
      
      {/* ── Page Header ── */}
      <header style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0, 51, 102, 0.05)', padding: '8px 16px', borderRadius: '30px', marginBottom: '16px' }}>
          <ShieldAlert size={18} color="var(--ashoka-blue)" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>Civic Verification Engine</span>
        </div>
        <h1 className="section-title" style={{ fontSize: '42px', fontWeight: 900 }}>Election Fact Checker</h1>
        <p className="section-subtitle" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Instantly cross-check WhatsApp forwards and news claims against official ECI databases and constitutional records.
        </p>
      </header>

      {/* ── Main Input Area ── */}
      <section className="gov-card" style={{ maxWidth: '800px', margin: '0 auto 40px', borderTop: '4px solid var(--ashoka-blue)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={14} /> PASTE A CLAIM FOR VERIFICATION
        </h3>
        <textarea
          className="gov-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter a specific claim (e.g. 'Is voter ID required for 2024?')..."
          style={{ minHeight: '120px', fontSize: '16px', marginBottom: '20px', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
           <button className="gov-button gov-button-accent" onClick={() => check()} disabled={loading || !text.trim()} style={{ padding: '12px 32px' }}>
             {loading ? 'Consulting Official Records...' : <><Search size={18} /> Verify Claim</>}
           </button>
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)' }}>EXAMPLES:</span>
             {EXAMPLES.slice(0, 2).map(ex => (
               <button key={ex} onClick={() => check(ex)} className="pill pill-inactive" style={{ fontSize: '11px', fontWeight: 600 }}>{ex.substring(0, 25)}...</button>
             ))}
           </div>
        </div>
      </section>

      <AnimatePresence>
        {/* ── Results Area ── */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="gov-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '60px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--ashoka-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <p style={{ fontWeight: 700, color: 'var(--ashoka-blue)' }}>Verifying against Election Commission records...</p>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Primary Verdict Card */}
            {(() => {
              const vc = VERDICT_CONFIG[result.overall_verdict] || VERDICT_CONFIG.UNVERIFIABLE
              return (
                <div className="gov-card" style={{ background: vc.bg, borderColor: vc.border, borderLeftWidth: '8px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ background: vc.color, color: '#fff', width: '40px', height: '40px', borderRadius: '10px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {vc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 900, color: vc.color, textTransform: 'uppercase', letterSpacing: '1px' }}>Verdict: {vc.label}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px' }}>Confidence: {result.confidence}</span>
                      </div>
                      <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px' }}>{result.summary}</h2>
                      <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{result.overall_explanation}</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Detailed Breakdown */}
            <div className="gov-card" style={{ padding: '0' }}>
               <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                 <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>FACT-BY-FACT BREAKDOWN</h3>
               </div>
               {result.claims.map((c, i) => {
                 const cv = VERDICT_CONFIG[c.verdict] || VERDICT_CONFIG.UNVERIFIABLE
                 const isExpanded = expanded[i]
                 return (
                   <div key={i} style={{ borderBottom: i < result.claims.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <button onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))} style={{ width: '100%', padding: '20px 24px', background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                           <div style={{ color: cv.color }}>{cv.icon}</div>
                           <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{c.claim}</span>
                         </div>
                         {isExpanded ? <ChevronUp size={20} color="var(--text-light)" /> : <ChevronDown size={20} color="var(--text-light)" />}
                      </button>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ padding: '0 24px 24px 60px' }}>
                           <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>{c.explanation}</p>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <FileText size={14} color="var(--ashoka-blue)" />
                              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>OFFICIAL SOURCE: {c.source}</span>
                           </div>
                        </motion.div>
                      )}
                   </div>
                 )
               })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
