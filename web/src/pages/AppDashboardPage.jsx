import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, ShieldCheck, PlayCircle, History, Trophy, FileText, ChevronRight, Star } from 'lucide-react'

const CORE_MODULES = [
  {
    title: 'Civic Assistant',
    desc: 'Real-time Q&A on election laws, voting steps, and citizen rights.',
    to: '/chat',
    icon: <MessageSquare size={24} />,
    status: 'Operational',
    color: 'var(--ashoka-blue)'
  },
  {
    title: 'Claim Verifier',
    desc: 'AI-powered fact-checking for social media claims and news.',
    to: '/fact-check',
    icon: <ShieldCheck size={24} />,
    status: 'Operational',
    color: 'var(--india-green)'
  },
  {
    title: 'EVM Simulator',
    desc: 'Interactive guide to the Electronic Voting Machine process.',
    to: '/evm-simulator',
    icon: <PlayCircle size={24} />,
    status: 'Training Module',
    color: 'var(--eci-saffron)'
  },
]

const DATA_MODULES = [
  { title: 'Election Timeline', to: '/timeline', icon: <History size={20} /> },
  { title: 'Civic Quiz', to: '/quiz', icon: <Trophy size={20} /> },
  { title: 'Jawaab Do', to: '/jawaab-do', icon: <FileText size={20} /> },
]

export default function AppDashboardPage() {
  return (
    <div className="app-container" style={{ padding: '60px 0 100px' }}>
      
      {/* ── Dashboard Header ── */}
      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ashoka-blue)', marginBottom: '8px' }}>
             <LayoutDashboard size={20} />
             <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px' }}>CIVIC WORKSPACE</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 900 }}>Select a Learning Pathway</h1>
          <p style={{ color: 'var(--text-muted)' }}>Welcome back. Choose a module to begin your civic education task.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
           <div style={{ background: '#fff', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-light)', marginBottom: '2px' }}>VOTER READINESS</p>
              <p style={{ fontSize: '18px', fontWeight: 900, color: 'var(--india-green)' }}>84%</p>
           </div>
        </div>
      </header>

      {/* ── Primary Grid ── */}
      <section className="feature-grid" style={{ marginBottom: '60px' }}>
        {CORE_MODULES.map((mod, i) => (
          <motion.div 
            key={mod.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={mod.to} className="gov-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', textDecoration: 'none', height: '100%', borderBottom: `4px solid ${mod.color}` }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-aside)', color: mod.color, display: 'grid', placeItems: 'center' }}>
                {mod.icon}
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ashoka-blue)' }}>{mod.title}</h3>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--india-green)', background: 'rgba(5, 106, 62, 0.05)', padding: '4px 8px', borderRadius: '4px' }}>{mod.status}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{mod.desc}</p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ashoka-blue)', fontWeight: 700, fontSize: '13px' }}>
                Open Module <ChevronRight size={16} />
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* ── Secondary Tools ── */}
      <section>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>ADDITIONAL CIVIC TOOLS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
           {DATA_MODULES.map(mod => (
             <Link key={mod.title} to={mod.to} className="gov-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', textDecoration: 'none' }}>
                <div style={{ color: 'var(--ashoka-blue)' }}>{mod.icon}</div>
                <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14px' }}>{mod.title}</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-light)' }} />
             </Link>
           ))}
        </div>
      </section>

      {/* ── Voter Tip Card ── */}
      <section className="gov-card" style={{ marginTop: '60px', background: 'var(--ashoka-blue)', color: '#fff', display: 'flex', gap: '24px', alignItems: 'center' }}>
         <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Star color="var(--eci-saffron)" fill="var(--eci-saffron)" size={24} />
         </div>
         <div>
            <h4 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>Did you know?</h4>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>You can check your name in the electoral roll using the Voter Helpline App or by visiting electoralsearch.eci.gov.in</p>
         </div>
         <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noreferrer" className="gov-button" style={{ marginLeft: 'auto', background: '#fff', color: 'var(--ashoka-blue)' }}>Check Now</a>
      </section>

    </div>
  )
}
