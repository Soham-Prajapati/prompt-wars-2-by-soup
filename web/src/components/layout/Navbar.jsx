import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Landmark } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/app', label: 'Dashboard' },
  { to: '/chat', label: 'Civic Assistant' },
  { to: '/map', label: 'Election Map' },
  { to: '/fact-check', label: 'Verifier' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/jawaab-do', label: 'Accountability' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="app-header">
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        <Link to="/" className="brand" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <div style={{ background: 'var(--ashoka-blue)', width: '42px', height: '42px', borderRadius: '10px', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Landmark size={24} />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--ashoka-blue)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Elect<span style={{ color: 'var(--eci-saffron)' }}>IQ</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--india-green)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Democracy Infrastructure
            </div>
          </div>
        </Link>

        <nav className="desktop-nav" style={{ gap: '4px' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <div style={{ textAlign: 'right', display: 'none' }}>
             <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-light)' }}>ECI PORTAL CONNECTED</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--india-green)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--india-green)' }}>SECURE</span>
             </div>
           </div>
           
           <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'transparent', border: 'none', color: 'var(--ashoka-blue)', cursor: 'pointer' }}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: '#fff', borderBottom: '2px solid var(--ashoka-blue)', padding: '20px' }}
          >
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={{ display: 'block', padding: '16px 0', fontSize: '16px', fontWeight: 700, color: 'var(--ashoka-blue)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                onClick={closeMenu}
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
