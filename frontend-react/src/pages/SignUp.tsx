// src/pages/SignUp.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function SignUp() {
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const passwordStrength = (() => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  })()
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength]
  const strengthColor = ['', '#EF4444', '#F59E0B', '#06B6D4', '#22C55E'][passwordStrength]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username || !form.password || !form.confirm) { setError('All fields are required.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch {
      setError('Account creation is not yet available. Use the demo credentials to explore.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#05070B' }}>
      <div className="absolute inset-0 bg-grid opacity-15 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
            <Shield size={18} color="white" fill="white" />
          </div>
          <span className="font-bold text-xl" style={{ color: '#F8FAFC' }}>ProofChain</span>
        </Link>

        <div className="p-8 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
          <h1 className="text-2xl font-black mb-2" style={{ color: '#F8FAFC', letterSpacing: '-0.5px' }}>
            Create your account
          </h1>
          <p className="text-sm mb-7" style={{ color: '#94A3B8' }}>
            Start verifying digital proofs in minutes
          </p>

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
              <input type="text" className="input-field" placeholder="yourname"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                autoComplete="username" disabled={loading} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-12"
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password" disabled={loading} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= passwordStrength ? strengthColor : '#1E293B' }} />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Confirm Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input-field pr-10"
                  placeholder="••••••••" value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  autoComplete="new-password" disabled={loading} />
                {form.confirm && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {form.password === form.confirm
                      ? <CheckCircle size={16} color="#22C55E" />
                      : <AlertCircle size={16} color="#EF4444" />}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : <>Create Account <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#94A3B8' }}>
            Already have an account?{' '}
            <Link to="/sign-in" className="font-semibold no-underline" style={{ color: '#A78BFA' }}>Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
