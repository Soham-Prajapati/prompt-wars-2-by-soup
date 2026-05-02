import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Users, Vote, Trophy, ChevronRight, Info, CheckCircle2, Clock, AlertTriangle, RefreshCcw } from 'lucide-react'
import { getTimeline, trackEvent } from '../api'

export default function TimelinePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true); setError(null)
    try { 
      const res = await getTimeline()
      if (!res || !res.phases) throw new Error("Malformed data received from server.")
      setData(res) 
    } catch (err) { 
      console.error("Timeline load failed:", err)
      setError(err.message || "Failed to load timeline data.")
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => {
    trackEvent('page_view', { page: 'timeline' })
    fetchData()
  }, [])

  if (loading) return (
    <div style={{ height: '80vh', display: 'grid', placeItems: 'center' }}>
       <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--ashoka-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Retrieving election schedule...</p>
       </div>
    </div>
  )

  if (error) return (
    <div style={{ height: '80vh', display: 'grid', placeItems: 'center' }}>
       <div className="gov-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '40px', borderTop: '4px solid #ef4444' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Loading Error</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>{error}</p>
          <button className="gov-button" onClick={fetchData}>
            <RefreshCcw size={16} /> Retry Connection
          </button>
       </div>
    </div>
  )

  return (
    <div className="app-container" style={{ padding: '60px 0 100px' }}>
      
      {/* ── Header ── */}
      <header style={{ marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0, 51, 102, 0.05)', padding: '6px 12px', borderRadius: '20px', marginBottom: '16px' }}>
          <Calendar size={14} color="var(--ashoka-blue)" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase' }}>Electoral Cycle Tracking</span>
        </div>
        <h1 className="section-title" style={{ fontSize: '42px' }}>{data.election}</h1>
        <p className="section-subtitle">{data.status}</p>
      </header>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '60px' }}>
         {Object.entries(data.key_stats || {}).map(([key, val]) => (
           <div key={key} className="gov-card" style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>{key.replace('_', ' ')}</p>
              <p style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ashoka-blue)' }}>{val}</p>
           </div>
         ))}
      </div>

      {/* ── Vertical Timeline ── */}
      <section style={{ position: 'relative', paddingLeft: '40px' }}>
        {/* Central Line */}
        <div style={{ position: 'absolute', left: '19px', top: '0', bottom: '0', width: '2px', background: 'var(--border)' }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {data.phases.map((phase, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              style={{ position: 'relative' }}
            >
              <div style={{ 
                position: 'absolute', left: '-30px', top: '0', width: '20px', height: '20px', borderRadius: '50%', 
                background: phase.isResult ? 'var(--india-green)' : (i === 0 ? 'var(--eci-saffron)' : '#fff'),
                border: `3px solid ${phase.isResult ? 'var(--india-green)' : 'var(--ashoka-blue)'}`,
                zIndex: 2, boxShadow: '0 0 0 4px #fff'
              }} />

              <div className="gov-card" style={{ padding: '24px', borderLeft: `6px solid ${phase.isResult ? 'var(--india-green)' : 'var(--ashoka-blue)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)' }}>{phase.phase.toUpperCase()}</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>{phase.name}</h3>
                  </div>
                  <div style={{ background: 'var(--bg-aside)', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--ashoka-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> {phase.date}
                  </div>
                </div>

                <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>{phase.description}</p>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                   {phase.seats > 0 && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Vote size={16} color="var(--text-light)" />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{phase.seats} Seats</span>
                     </div>
                   )}
                   {phase.states > 0 && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={16} color="var(--text-light)" />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{phase.states} States/UTs</span>
                     </div>
                   )}
                   {phase.turnout !== 'N/A' && (
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={16} color="var(--text-light)" />
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Turnout: {phase.turnout}</span>
                     </div>
                   )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}
