// src/components/Navbar.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Shield, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_LINKS = [
  { label: 'Product', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Security', href: '/security' },
  { label: 'Features', href: '/#features' },
  { label: 'Developers', href: '/#faq' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-navbar py-3' : 'py-5'
        }`}
        style={scrolled ? {} : { background: 'transparent' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          
          {/* Left Side: Menu Icon & Logo */}
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-lg border-0 cursor-pointer flex items-center justify-center transition-colors hover:bg-[#1E293B]/80"
              style={{ background: 'rgba(30,41,59,0.5)', color: '#94A3B8' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                <Shield size={16} color="white" fill="white" />
              </div>
              <span className="font-bold text-lg tracking-tight hidden sm:block" style={{ color: '#F8FAFC' }}>
                ProofChain
              </span>
            </Link>
          </div>

          {/* Right Side: CTA */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard"
                  className="text-sm font-medium no-underline px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200"
                  style={{ color: '#94A3B8', border: '1px solid #1E293B' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F8FAFC'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#7C3AED' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1E293B' }}
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout}
                  className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 border-0 cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in"
                  className="hidden sm:block text-sm font-medium no-underline px-4 py-2 rounded-lg transition-all duration-200"
                  style={{ color: '#94A3B8', border: '1px solid #1E293B' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#F8FAFC' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94A3B8' }}
                >
                  Sign In
                </Link>
                <Link to="/sign-up"
                  className="text-sm font-semibold no-underline px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#ffffff' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(124,58,237,0.4)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '' }}
                >
                  Get Started <ChevronRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 glass-navbar p-6 shadow-2xl"
            style={{ borderTop: '1px solid #1E293B', background: 'rgba(11, 15, 23, 0.95)' }}
          >
            <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row gap-8">
              <div className="flex flex-col gap-4 flex-1">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>Navigation</h3>
                {NAV_LINKS.map(link => (
                  <a key={link.label} href={link.href}
                    className="text-base font-medium no-underline py-2 transition-colors hover:text-white"
                    style={{ color: '#94A3B8', borderBottom: '1px solid #1E293B' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              
              <div className="flex flex-col gap-4 sm:w-64 pt-2 sm:pt-0 sm:border-l border-[#1E293B] sm:pl-8">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>Account</h3>
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                      className="btn-secondary text-center no-underline justify-center">Dashboard</Link>
                    <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                      className="btn-secondary border-0 cursor-pointer justify-center" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/sign-in" onClick={() => setMenuOpen(false)}
                      className="btn-secondary text-center no-underline justify-center">Sign In</Link>
                    <Link to="/sign-up" onClick={() => setMenuOpen(false)}
                      className="btn-primary text-center no-underline justify-center">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
