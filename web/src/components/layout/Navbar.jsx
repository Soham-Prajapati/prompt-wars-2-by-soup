import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/app', label: 'Dashboard' },
  { to: '/chat', label: 'AI Assistant' },
  { to: '/fact-check', label: 'Verifier' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/jawaab-do', label: 'Jawaab Do' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="app-header glass-panel" style={{ position: 'sticky', top: 0, zIndex: 100, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, background: 'rgba(11, 13, 20, 0.8)' }}>
      <div className="flag-stripe" style={{ height: '3px', background: 'linear-gradient(90deg, var(--saffron), #fff, var(--green))' }} />
      <div className="app-container app-header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
        <Link to="/" className="brand" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div className="brand-logo" style={{ background: 'var(--saffron)', width: '36px', height: '36px', borderRadius: '8px', display: 'grid', placeItems: 'center', fontWeight: 800, color: '#fff', fontSize: '18px' }}>E</div>
          <div>
            <div className="brand-title" style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              Elect<span style={{ color: 'var(--saffron)' }}>IQ</span>
            </div>
          </div>
        </Link>

        <nav className="desktop-nav" style={{ display: 'flex', gap: '8px' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                color: isActive ? 'var(--saffron)' : 'var(--ink-mid)',
                background: isActive ? 'rgba(255, 153, 51, 0.1)' : 'transparent',
                transition: 'all 0.2s ease'
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--green)', background: 'rgba(29, 185, 84, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
             <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
             Live ECI API
           </span>
           <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#fff' }}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mobile-menu glass-panel"
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, borderRadius: 0, background: 'var(--surface-2)', padding: '20px' }}
          >
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className="mobile-menu-link"
                onClick={closeMenu}
                style={{ display: 'block', padding: '12px 0', fontSize: '18px', color: 'var(--ink)', textDecoration: 'none' }}
              >
                {item.label}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
