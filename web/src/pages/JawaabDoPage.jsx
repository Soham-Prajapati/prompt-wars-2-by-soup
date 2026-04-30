import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, ShieldCheck, CheckCircle2, AlertTriangle, Image as ImageIcon, Send, History, Filter } from 'lucide-react'
import { submitReport, getReports, getPromises, trackEvent } from '../api'

export default function JawaabDoPage() {
  const [view, setView] = useState('feed') // 'feed' or 'submit'
  const [reports, setReports] = useState([])
  const [promises, setPromises] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ party: 'BJP', claim_text: '', category: 'Infrastructure', promise_id: '' })
  const [image, setImage] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    trackEvent('page_view', { page: 'accountability' })
    fetchReports()
    fetchPromises()
  }, [])

  const fetchReports = async () => {
    try { const res = await getReports(); setReports(res.reports || []) } catch (e) { console.error(e) }
  }

  const fetchPromises = async () => {
    try { const res = await getPromises(); setPromises(res.promises || []) } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setStatus(null)
    try {
      const res = await submitReport(formData, image)
      setStatus({ type: 'success', message: res.message })
      setFormData({ party: 'BJP', claim_text: '', category: 'Infrastructure', promise_id: '' })
      setImage(null)
      setTimeout(() => setView('feed'), 2000)
      fetchReports()
    } catch (err) { setStatus({ type: 'error', message: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <div className="app-container" style={{ padding: '60px 0 100px' }}>
      
      {/* ── Header ── */}
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ashoka-blue)', marginBottom: '8px' }}>
              <FileText size={20} />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px' }}>CITIZEN ACCOUNTABILITY PORTAL</span>
           </div>
           <h1 style={{ fontSize: '36px', fontWeight: 900 }}>Jawaab Do — जवाब दो</h1>
           <p style={{ color: 'var(--text-muted)' }}>Anonymous, evidence-backed platform to track political promise fulfillment.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-aside)', padding: '6px', borderRadius: '12px', border: '1px solid var(--border)' }}>
           <button onClick={() => setView('feed')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: view === 'feed' ? '#fff' : 'transparent', color: view === 'feed' ? 'var(--ashoka-blue)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', boxShadow: view === 'feed' ? 'var(--shadow-sm)' : 'none' }}>
             <History size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Verified Feed
           </button>
           <button onClick={() => setView('submit')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: view === 'submit' ? '#fff' : 'transparent', color: view === 'submit' ? 'var(--ashoka-blue)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', boxShadow: view === 'submit' ? 'var(--shadow-sm)' : 'none' }}>
             <Plus size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Submit Report
           </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'feed' ? (
          <motion.section key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
             {/* Feed Controls */}
             <div style={{ marginBottom: '32px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Filter size={18} color="var(--text-light)" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>FILTER BY:</span>
                <select className="gov-input" style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}>
                   <option>All Parties</option>
                   <option>BJP</option>
                   <option>INC</option>
                </select>
             </div>

             {/* Reports Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                {reports.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 0' }}>
                     <div style={{ opacity: 0.5, marginBottom: '20px' }}><FileText size={48} style={{ margin: '0 auto' }} /></div>
                     <h3 style={{ color: 'var(--text-muted)' }}>No reports submitted for this area yet.</h3>
                  </div>
                ) : (
                  reports.map(report => (
                    <motion.article key={report.id} className="gov-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--ashoka-blue)', background: 'rgba(0,51,102,0.05)', padding: '4px 10px', borderRadius: '4px' }}>{report.party}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>{new Date(report.verified_at).toLocaleDateString()}</span>
                       </div>
                       <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.5 }}>{report.claim_text}</p>
                       <div style={{ background: 'var(--bg-aside)', padding: '12px', borderRadius: '8px', borderLeft: '3px solid var(--eci-saffron)' }}>
                          <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--eci-saffron)', textTransform: 'uppercase', marginBottom: '4px' }}>Linked Promise</p>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{report.promise_text || "General Accountability"}</p>
                       </div>
                       <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <CheckCircle2 size={14} color="var(--india-green)" />
                             <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--india-green)' }}>AI VERIFIED {report.ai_confidence}%</span>
                          </div>
                          <button className="gov-button gov-button-outline" style={{ fontSize: '11px', padding: '6px 12px' }}>View Evidence</button>
                       </div>
                    </motion.article>
                  ))
                )}
             </div>
          </motion.section>
        ) : (
          <motion.section key="submit" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
             <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} className="gov-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)', marginBottom: '10px' }}>DESCRIBE THE UNFULFILLED PROMISE</label>
                      <textarea 
                        className="gov-input" 
                        required 
                        style={{ minHeight: '120px' }}
                        value={formData.claim_text}
                        onChange={e => setFormData({...formData, claim_text: e.target.value})}
                        placeholder="State clearly what was promised and what is the current reality..."
                      />
                   </div>

                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                         <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)', marginBottom: '10px' }}>POLITICAL PARTY</label>
                         <select className="gov-input" value={formData.party} onChange={e => setFormData({...formData, party: e.target.value})}>
                            <option>BJP</option>
                            <option>INC</option>
                            <option>AAP</option>
                            <option>SP</option>
                            <option>TMC</option>
                         </select>
                      </div>
                      <div>
                         <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)', marginBottom: '10px' }}>CATEGORY</label>
                         <select className="gov-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option>Infrastructure</option>
                            <option>Healthcare</option>
                            <option>Education</option>
                            <option>Employment</option>
                            <option>Welfare</option>
                         </select>
                      </div>
                   </div>

                   <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--ashoka-blue)', marginBottom: '10px' }}>UPLOAD PHOTO EVIDENCE (OPTIONAL)</label>
                      <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ashoka-blue)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                         <ImageIcon size={32} color="var(--text-light)" style={{ margin: '0 auto 12px' }} />
                         <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{image ? image.name : "Click to select a photo from the location"}</p>
                         <input type="file" style={{ display: 'none' }} />
                      </div>
                   </div>

                   <div style={{ background: 'var(--bg-aside)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                         <ShieldCheck size={20} color="var(--india-green)" style={{ flexShrink: 0 }} />
                         <div>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: 'var(--india-green)', marginBottom: '4px' }}>PRIVACY GUARANTEE</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Your submission is 100% anonymous. We strip all EXIF metadata from photos and never store your IP address or identity. Gemini AI will verify your evidence before it appears on the public feed.</p>
                         </div>
                      </div>
                   </div>

                   {status && (
                     <div style={{ padding: '16px', borderRadius: '8px', background: status.type === 'success' ? 'rgba(5,106,62,0.1)' : 'rgba(239,68,68,0.1)', color: status.type === 'success' ? 'var(--india-green)' : '#ef4444', fontWeight: 700, fontSize: '14px' }}>
                        {status.message}
                     </div>
                   )}

                   <button type="submit" disabled={loading || !formData.claim_text} className="gov-button gov-button-accent" style={{ padding: '16px', justifyContent: 'center', fontSize: '16px', fontWeight: 900 }}>
                      {loading ? 'ANALYSING & ANONYMIZING...' : <><Send size={18} /> SUBMIT ANONYMOUS REPORT</>}
                   </button>
                </form>
             </div>
          </motion.section>
        )}
      </AnimatePresence>

    </div>
  )
}
