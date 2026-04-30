import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MessageSquare, CheckCircle, Smartphone, MapPin, Zap } from 'lucide-react'
import { CONSTITUENCIES } from '../data/constituencies'

const QUICK_ACTIONS = [
  {
    title: 'Conversational AI',
    body: 'Get instant, neutral, and translated answers about EVMs, voting rights, and the election process from our Gemini-powered guide.',
    cta: 'Start Asking',
    to: '/chat',
    icon: <MessageSquare size={24} />
  },
  {
    title: 'Misinformation Detector',
    body: 'Paste WhatsApp forwards or headlines and check them against trusted ECI election references instantly.',
    cta: 'Verify Claim',
    to: '/fact-check',
    icon: <CheckCircle size={24} />
  },
  {
    title: 'EVM Simulator',
    body: 'Run a guided simulation of the voting machine to understand what happens at every step in the polling booth.',
    cta: 'Try Simulator',
    to: '/evm-simulator',
    icon: <Smartphone size={24} />
  },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const value = query.toLowerCase()
    return CONSTITUENCIES.filter(
      c => c.name.toLowerCase().includes(value) || c.state.toLowerCase().includes(value)
    ).slice(0, 5)
  }, [query])

  return (
    <div className="home-page" style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '100px' }}>
      
      {/* ── Hero Section ── */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginTop: '60px' }}
      >
        <span className="pill pill-inactive" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: '13px', background: 'rgba(255,255,255,0.05)', color: 'var(--ink)' }}>
          <Zap size={14} color="var(--saffron)" /> Version 1.1 — Powered by Google Vertex AI & Gemini Nano
        </span>
        <h1 style={{ fontSize: '64px', fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 24 }}>
          Indian Democracy, <br />
          <span className="hero-gradient">Made Legible.</span>
        </h1>
        <p style={{ fontSize: 'var(--size-lg)', color: 'var(--ink-mid)', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.5 }}>
          Your offline-first, multilingual civic assistant. Understand your constituency, verify claims, and build confidence before polling day.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <Link className="glow-button" to="/chat">
            Start Q&A <MessageSquare size={18} />
          </Link>
          <Link className="glow-button-secondary" to="/jawaab-do">
            Submit Report
          </Link>
        </div>
      </motion.section>

      {/* ── Constituency Finder ── */}
      <motion.section 
        className="glass-panel"
        style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <MapPin color="var(--saffron)" size={28} />
          <h2 style={{ fontSize: 'var(--size-xl)', fontWeight: 700 }}>Find your constituency</h2>
        </div>
        <div className="finder" style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 16, top: 16, color: 'var(--ink-light)' }} size={20} />
          <input
            id="constituency-search"
            className="input"
            style={{ paddingLeft: '48px', height: '54px', fontSize: 'var(--size-md)', background: 'var(--surface-3)', border: '1px solid var(--border-strong)', color: 'var(--ink)' }}
            placeholder="Search by constituency or state (e.g. Varanasi)..."
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelected(null)
            }}
          />
          {matches.length > 0 && (
            <div className="finder-results glass-panel" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 8, padding: 8 }}>
              {matches.map(item => (
                <button
                  type="button"
                  key={`${item.name}-${item.state}`}
                  className="finder-item"
                  style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer', textAlign: 'left' }}
                  onClick={() => {
                    setSelected(item)
                    setQuery(item.name)
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <strong style={{ fontSize: 'var(--size-base)' }}>{item.name}</strong>
                  <span style={{ color: 'var(--ink-mid)' }}>{item.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--saffron-bg)', border: '1px solid var(--saffron-border)', padding: '16px 24px', borderRadius: '12px' }}>
            <div>
              <p style={{ color: 'var(--ink-mid)', fontSize: 'var(--size-sm)' }}>Selected Constituency</p>
              <p style={{ fontSize: 'var(--size-md)', fontWeight: 600, color: 'var(--saffron)' }}>{selected.name}, {selected.state}</p>
            </div>
            <Link className="glow-button" style={{ padding: '8px 16px', fontSize: '14px' }} to={`/constituency/${selected.slug}`}>View Details</Link>
          </motion.div>
        )}
      </motion.section>

      {/* ── Feature Grid ── */}
      <motion.section 
        className="feature-grid"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {QUICK_ACTIONS.map((item, i) => (
          <motion.article 
            key={item.title} 
            className="glass-panel feature-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="icon-wrapper">
              {item.icon}
            </div>
            <h3 style={{ fontSize: 'var(--size-lg)', fontWeight: 700 }}>{item.title}</h3>
            <p style={{ color: 'var(--ink-mid)', lineHeight: 1.6, flex: 1 }}>{item.body}</p>
            <Link to={item.to} className="glow-button-secondary" style={{ alignSelf: 'flex-start', marginTop: '16px' }}>{item.cta}</Link>
          </motion.article>
        ))}
      </motion.section>
    </div>
  )
}
