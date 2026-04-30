import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MessageSquare, ShieldCheck, PlayCircle, MapPin, ChevronRight, Info } from 'lucide-react'
import { CONSTITUENCIES } from '../data/constituencies'

const QUICK_ACTIONS = [
  {
    title: 'Civic Assistant',
    body: 'Get instant, neutral, and translated answers about EVMs, voting rights, and the election process from our AI guide.',
    cta: 'Launch Assistant',
    to: '/chat',
    icon: <MessageSquare size={20} />
  },
  {
    title: 'Fact Verifier',
    body: 'Verify WhatsApp forwards or news claims against official Election Commission data and references.',
    cta: 'Check a Claim',
    to: '/fact-check',
    icon: <ShieldCheck size={20} />
  },
  {
    title: 'Voting Simulator',
    body: 'Step inside a virtual polling booth and learn exactly how to use the EVM and VVPAT machines.',
    cta: 'Try Simulator',
    to: '/evm-simulator',
    icon: <PlayCircle size={20} />
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
    <div className="home-page" style={{ paddingBottom: '100px' }}>
      
      {/* ── Hero ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '80px 0 60px' }}>
        <div className="app-container">
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-aside)', padding: '6px 12px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <Info size={14} color="var(--ashoka-blue)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ashoka-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Civic Intelligence Portal</span>
            </div>
            <h1 style={{ fontSize: '56px', lineHeight: 1.1, marginBottom: '24px' }}>
              Understanding your vote <br />
              <span style={{ color: 'var(--eci-saffron)' }}>starts here.</span>
            </h1>
            <p className="section-subtitle" style={{ fontSize: '20px', marginBottom: '40px' }}>
              ElectIQ is a neutral, multilingual platform designed to educate every Indian citizen on the democratic process, from registration to results.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link className="gov-button" style={{ padding: '14px 28px', fontSize: '16px' }} to="/chat">
                Start Learning <ChevronRight size={18} />
              </Link>
              <Link className="gov-button gov-button-outline" style={{ padding: '14px 28px', fontSize: '16px' }} to="/app">
                Explore Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="app-container" style={{ marginTop: '-40px' }}>
        {/* ── Constituency Finder Card ── */}
        <section className="gov-card" style={{ maxWidth: '900px', margin: '0 auto', borderBottom: '4px solid var(--eci-saffron)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
            <MapPin color="var(--ashoka-blue)" size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Know Your Constituency</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={20} />
            <input
              className="gov-input"
              style={{ paddingLeft: '48px', fontSize: '16px', height: '56px' }}
              placeholder="Enter your constituency or state (e.g. Nagpur)..."
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setSelected(null)
              }}
            />
            {matches.length > 0 && (
              <div className="gov-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 8, padding: 8 }}>
                {matches.map(item => (
                  <button
                    key={`${item.name}-${item.state}`}
                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '14px 16px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', fontWeight: 500 }}
                    onClick={() => {
                      setSelected(item)
                      setQuery(item.name)
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-aside)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-aside)', borderRadius: '8px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>MAPPING DATA FOR:</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>{selected.name}, {selected.state}</p>
              </div>
              <Link className="gov-button" to={`/constituency/${selected.slug}`}>View Profile</Link>
            </motion.div>
          )}
        </section>

        {/* ── Feature Grid ── */}
        <section className="feature-grid" style={{ marginTop: '60px' }}>
          {QUICK_ACTIONS.map((item, i) => (
            <article key={item.title} className="gov-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 51, 102, 0.05)', color: 'var(--ashoka-blue)', display: 'grid', placeItems: 'center' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', flex: 1 }}>{item.body}</p>
              <Link to={item.to} className="gov-button gov-button-outline" style={{ alignSelf: 'flex-start', fontSize: '13px' }}>
                {item.cta}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
