import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MessageSquare, ShieldCheck, PlayCircle, MapPin, ChevronRight, Info } from 'lucide-react'
import { CONSTITUENCIES } from '../data/constituencies'
import { useLanguage } from '../context/LanguageContext'
import { t } from '../data/translations'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const { language } = useLanguage()

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const value = query.toLowerCase()
    return CONSTITUENCIES.filter(
      c => c.name.toLowerCase().includes(value) || c.state.toLowerCase().includes(value)
    ).slice(0, 5)
  }, [query])

  const QUICK_ACTIONS = [
    {
      title: t('civic_assistant', language),
      body: t('hero_desc', language),
      cta: t('launch', language),
      to: '/chat',
      icon: <MessageSquare size={20} />
    },
    {
      title: t('fact_verifier', language),
      body: 'Verify WhatsApp forwards or news claims against official data.',
      cta: t('check_claim', language),
      to: '/fact-check',
      icon: <ShieldCheck size={20} />
    },
    {
      title: t('voting_simulator', language),
      body: 'Step inside a virtual polling booth and learn how to use EVMs.',
      cta: t('try_simulator', language),
      to: '/evm-simulator',
      icon: <PlayCircle size={20} />
    },
  ]

  return (
    <div className="home-page" style={{ paddingBottom: '100px' }}>
      
      {/* ── Hero Section ── */}
      <section style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '60px 0 80px' }}>
        <div className="app-container">
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-aside)', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <Info size={14} color="var(--ashoka-blue)" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ashoka-blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('official_portal', language)}</span>
            </div>
            <h1 style={{ fontSize: '52px', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em' }}>
              {t('hero_title', language)} <br />
              <span style={{ color: 'var(--eci-saffron)' }}>{t('hero_subtitle', language)}</span>
            </h1>
            <p className="section-subtitle" style={{ fontSize: '18px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              {t('hero_desc', language)}
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link className="gov-button" style={{ padding: '12px 30px', fontSize: '15px' }} to="/chat">
                {t('btn_learning', language)} <ChevronRight size={18} />
              </Link>
              <Link className="gov-button gov-button-outline" style={{ padding: '12px 30px', fontSize: '15px' }} to="/app">
                {t('btn_dashboard', language)}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Content Area (No Overlap) ── */}
      <div className="app-container" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '60px' }}>
        
        {/* Constituency Finder */}
        <section className="gov-card" style={{ maxWidth: '900px', margin: '0 auto', borderBottom: '4px solid var(--eci-saffron)', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '24px' }}>
            <MapPin color="var(--ashoka-blue)" size={24} />
            <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{t('know_constituency', language)}</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} size={20} />
            <input
              className="gov-input"
              style={{ paddingLeft: '48px', fontSize: '16px', height: '56px' }}
              placeholder={t('search_placeholder', language)}
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setSelected(null)
              }}
            />
            {matches.length > 0 && (
              <div className="gov-card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: 8, padding: 8, boxShadow: 'var(--shadow-md)' }}>
                {matches.map(item => (
                  <button
                    key={`${item.name}-${item.state}`}
                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}
                    onClick={() => {
                      setSelected(item)
                      setQuery(item.name)
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-aside)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selected && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-aside)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Location</p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>{selected.name}, {selected.state}</p>
              </div>
              <Link className="gov-button" to={`/constituency/${selected.slug}`}>View Profile</Link>
            </motion.div>
          )}
        </section>

        {/* Action Grid */}
        <section className="feature-grid">
          {QUICK_ACTIONS.map((item, i) => (
            <article key={item.title} className="gov-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 51, 102, 0.05)', color: 'var(--ashoka-blue)', display: 'grid', placeItems: 'center' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', flex: 1, lineHeight: 1.5 }}>{item.body}</p>
              <Link to={item.to} className="gov-button gov-button-outline" style={{ alignSelf: 'flex-start', fontSize: '13px', padding: '8px 16px' }}>
                {item.cta}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </div>
  )
}
