import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Landmark, Globe, ChevronDown } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../data/translations'

const NAV_ITEMS = [
  { to: '/', label: 'nav_home' },
  { to: '/app', label: 'nav_dash' },
  { to: '/chat', label: 'nav_assistant' },
  { to: '/map', label: 'nav_map' },
  { to: '/fact-check', label: 'nav_verifier' },
  { to: '/timeline', label: 'nav_timeline' },
  { to: '/jawaab-do', label: 'nav_accountability' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { language, setLanguage, LANGUAGES } = useLanguage()

  const closeMenu = () => { setMenuOpen(false); setLangOpen(false); }

  return (
    <header className="app-header">
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
        
        {/* Brand Identity */}
        <Link to="/" className="brand" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ background: 'var(--ashoka-blue)', width: '38px', height: '38px', borderRadius: '8px', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <Landmark size={20} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--ashoka-blue)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              Elect<span style={{ color: 'var(--eci-saffron)' }}>IQ</span>
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--india-green)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {t('brand_sub', language)}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" style={{ gap: '2px' }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
              style={{ fontSize: '13px' }}
            >
              {t(item.label, language)}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
           
           {/* Language Dropdown */}
           <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setLangOpen(!langOpen)}
                className="gov-button gov-button-outline" 
                style={{ padding: '6px 10px', fontSize: '11px', gap: '4px', height: '34px' }}
              >
                <Globe size={14} /> {language} <ChevronDown size={12} />
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="gov-card" 
                    style={{ 
                      position: 'absolute', top: '100%', right: 0, zIndex: 110, marginTop: '8px', 
                      width: '180px', maxHeight: '250px', overflowY: 'auto', padding: '6px',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    {LANGUAGES.map(l => (
                      <button
                        key={l}
                        onClick={() => { setLanguage(l); setLangOpen(false); }}
                        style={{ 
                          width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none',
                          fontSize: '12px', fontWeight: 600, color: language === l ? 'var(--ashoka-blue)' : 'var(--text-muted)',
                          cursor: 'pointer', borderRadius: '4px',
                          backgroundColor: language === l ? 'var(--bg-aside)' : 'transparent'
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* Mobile Toggle */}
           <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'transparent', border: 'none', color: 'var(--ashoka-blue)', cursor: 'pointer' }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: '#fff', borderBottom: '2px solid var(--ashoka-blue)', padding: '10px 20px', overflow: 'hidden' }}
          >
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={{ display: 'block', padding: '12px 0', fontSize: '15px', fontWeight: 700, color: 'var(--ashoka-blue)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
                onClick={closeMenu}
              >
                {t(item.label, language)}
              </NavLink>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
