// src/pages/SignIn.tsx
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function SignIn() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#05070B' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 lg:w-1/2 flex-shrink-0 relative overflow-hidden"
        style={{ background: '#0B0F17', borderRight: '1px solid #1E293B' }}>
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />

        <Link to="/" className="relative flex items-center gap-2.5 no-underline z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
            <Shield size={18} color="white" fill="white" />
          </div>
          <span className="font-bold text-lg" style={{ color: '#F8FAFC' }}>ProofChain</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-4" style={{ color: '#F8FAFC', letterSpacing: '-1px' }}>
            Verify. Prove. Trust.
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#94A3B8' }}>
            Secure digital proof verification powered by cryptographic integrity and video-based identity proof.
          </p>
          <div className="space-y-3">
            {['SHA-256 cryptographic hashing', 'Blockchain-anchored records', 'Video verification', 'Tamper detection alerts'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
                <span className="text-sm" style={{ color: '#94A3B8' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: '#475569' }}>© 2026 ProofChain</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2.5 no-underline mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Shield size={16} color="white" fill="white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#F8FAFC' }}>ProofChain</span>
          </Link>

          <h1 className="text-2xl font-black mb-2" style={{ color: '#F8FAFC', letterSpacing: '-0.5px' }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>Sign in to your ProofChain account</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-xl mb-6"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
              <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="investigator"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: '#94A3B8' }}>Password</label>
                <Link to="/forgot-password" className="text-xs no-underline" style={{ color: '#7C3AED' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#94A3B8' }}>
            Don't have an account?{' '}
            <Link to="/sign-up" className="font-semibold no-underline" style={{ color: '#A78BFA' }}>
              Create account
            </Link>
          </p>

          <div className="mt-8 p-4 rounded-xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <p className="font-semibold mb-2" style={{ color: '#A78BFA' }}>Demo credentials</p>
            <div className="flex flex-col gap-1 text-[#94A3B8] font-mono text-xs">
              <div>admin / admin123</div>
              <div>investigator / investigator123</div>
              <div>viewer / viewer123</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
