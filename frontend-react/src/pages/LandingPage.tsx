// src/pages/LandingPage.tsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Shield, CheckCircle, Video, QrCode, FileSearch, Lock,
  ChevronRight, ArrowRight, Upload, Hash, Eye, Share2,
  AlertTriangle, UserX, FileX, Database, Clock, Globe,
  Zap, GraduationCap, Briefcase, Building2, User, Calendar,
  Plus, Minus, Star, TrendingUp, Award
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

// ── Animated background lines ──────────────────────────────────────────────
function BackgroundLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <svg width="100%" height="100%" className="absolute inset-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="line1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
            <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[
          { d: "M-100,200 C200,100 400,300 700,150 S1100,50 1500,200", grad: "url(#line1)", delay: 0 },
          { d: "M-100,350 C300,250 500,450 800,300 S1200,150 1500,350", grad: "url(#line2)", delay: 0.8 },
          { d: "M-100,500 C200,400 600,600 900,450 S1300,300 1500,500", grad: "url(#line1)", delay: 1.6 },
          { d: "M-100,650 C300,550 500,750 800,600 S1200,450 1500,650", grad: "url(#line2)", delay: 2.4 },
          { d: "M-100,800 C200,700 600,900 900,750 S1300,600 1500,800", grad: "url(#line1)", delay: 3.2 },
        ].map((line, i) => (
          <motion.path
            key={i}
            d={line.d}
            stroke={line.grad}
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 4, delay: line.delay, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse', repeatDelay: 2 }}
          />
        ))}
      </svg>
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      {/* Radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
    </div>
  )
}

// ── Animated Counter ──────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    let start = 0
    const step = to / 60
    const timer = setInterval(() => {
      start += step
      if (start >= to) { setCount(to); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [inView, to])
  return <span ref={ref}>{count}{suffix}</span>
}

// ── Scroll Reveal ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ── Hero Verification Card ────────────────────────────────────────────────
function HeroCard() {
  const [step, setStep] = useState(0)
  const steps = [
    { label: 'Document Integrity', done: true },
    { label: 'Hash Verified', done: true },
    { label: 'Issuer Verified', done: false },
    { label: 'Video Verified', done: false },
  ]

  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % 5), 1200)
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      className="verification-card-demo max-w-sm w-full"
      style={{ boxShadow: '0 0 60px rgba(124,58,237,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #1E293B' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
            <Shield size={14} color="white" fill="white" />
          </div>
          <span className="text-sm font-bold" style={{ color: '#F8FAFC' }}>ProofChain</span>
        </div>
        <span className="badge-verified text-xs">VERIFIED</span>
      </div>

      {/* Checks */}
      <div className="space-y-3 mb-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.label}
            className="flex items-center gap-3"
            animate={{ opacity: i <= step ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              animate={{
                background: i <= step ? 'rgba(34,197,94,0.1)' : 'rgba(30,41,59,0.5)',
                borderColor: i <= step ? 'rgba(34,197,94,0.4)' : '#1E293B',
              }}
              className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0"
            >
              {i <= step ? <CheckCircle size={12} color="#22C55E" /> :
                <div className="w-2 h-2 rounded-full" style={{ background: '#1E293B' }} />}
            </motion.div>
            <span className="text-sm font-medium" style={{ color: i <= step ? '#F8FAFC' : '#475569' }}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* ID */}
      <div className="p-3 rounded-lg" style={{ background: 'rgba(11,15,23,0.8)', border: '1px solid #1E293B' }}>
        <div className="text-xs mb-1" style={{ color: '#475569' }}>VERIFICATION ID</div>
        <div className="font-mono text-sm font-bold" style={{ color: '#7C3AED' }}>PC-2026-X82A91</div>
      </div>

      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{ boxShadow: ['0 0 0 0 rgba(124,58,237,0)', '0 0 0 4px rgba(124,58,237,0.3)', '0 0 0 0 rgba(124,58,237,0)'] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
    </motion.div>
  )
}

// ── FAQ Item ──────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'What is ProofChain?', a: 'ProofChain is a secure digital proof verification platform that uses cryptographic hashing and blockchain technology to verify the authenticity and integrity of digital documents and credentials.' },
  { q: 'How does document verification work?', a: 'When a document is registered, ProofChain generates a unique SHA-256 fingerprint and records it on the blockchain. Verification re-computes the hash and compares it to the original — any tampering produces a different hash and is instantly detected.' },
  { q: 'How does video verification work?', a: 'Users record or upload a short video responding to a verification challenge. The video is hashed and stored securely. All check results (integrity, challenge response) are clearly labeled — no unvalidated claims about deepfake detection are made.' },
  { q: 'Can a proof be revoked?', a: 'Yes. Authorized issuers can revoke proofs at any time. Revoked proofs are clearly marked and rejected during verification.' },
  { q: 'Can anyone verify a proof?', a: 'Yes. Public verification is available at /verify/:proofId without requiring a login, showing only publicly safe information.' },
  { q: 'Is the verification video public?', a: 'No. Videos are stored privately and only accessible to authenticated users with the appropriate role. Access is logged for every view.' },
  { q: 'How is the proof protected?', a: 'Every proof hash is recorded on-chain (Ethereum-compatible). The database stores evidence metadata and hashes. File content stays in secure server storage, not publicly exposed.' },
  { q: 'What happens if a document is modified?', a: 'Even a single byte change produces a completely different SHA-256 hash. ProofChain immediately flags the evidence as TAMPERED and logs a security alert.' },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b" style={{ borderColor: '#1E293B' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F8FAFC' }}
      >
        <span className="text-base font-semibold">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: open ? 'rgba(124,58,237,0.2)' : 'rgba(30,41,59,0.5)', color: open ? '#A78BFA' : '#94A3B8' }}>
          <Plus size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Landing Page ─────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div style={{ background: '#05070B', color: '#F8FAFC', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6">
        <BackgroundLines />
        <div className="relative z-10 max-w-[1600px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              {/* Trust badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: 'pulse 2s ease infinite' }} />
                <span className="text-sm font-semibold">Secure Digital Verification Platform</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-black leading-tight mb-6"
                style={{ fontSize: 'clamp(48px, 7vw, 80px)', color: '#F8FAFC', letterSpacing: '-2px' }}
              >
                Trust Every{' '}
                <span className="gradient-text">Proof.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg leading-relaxed mb-10"
                style={{ color: '#94A3B8', maxWidth: '520px' }}
              >
                ProofChain helps organizations verify digital documents, credentials, and identity evidence with cryptographic integrity, secure verification workflows, and video-based proof.
              </motion.p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-wrap items-center gap-4 justify-center lg:justify-start"
              >
                <Link to="/sign-up" className="btn-primary text-base no-underline px-6 py-3">
                  Start Verifying <ArrowRight size={18} />
                </Link>
                <a href="#how-it-works" className="btn-secondary text-base no-underline px-6 py-3">
                  Explore Verification
                </a>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-8 mt-14 justify-center lg:justify-start"
              >
                {[
                  { value: 128, suffix: '+', label: 'Proofs Verified' },
                  { value: 99, suffix: '%', label: 'Integrity Rate' },
                  { value: 7, suffix: '', label: 'Check Layers' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-3xl font-black" style={{ color: '#F8FAFC' }}>
                      <Counter to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-sm" style={{ color: '#475569' }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Hero Card */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <HeroCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST INDICATORS ─────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid #1E293B', borderBottom: '1px solid #1E293B', background: 'rgba(11,15,23,0.6)' }}>
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { icon: <Lock size={20} />, label: 'Cryptographic Integrity' },
              { icon: <Database size={20} />, label: 'Secure Storage' },
              { icon: <AlertTriangle size={20} />, label: 'Tamper Detection' },
              { icon: <Video size={20} />, label: 'Video Verification' },
              { icon: <QrCode size={20} />, label: 'QR Verification' },
              { icon: <Clock size={20} />, label: 'Audit Trails' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
                  {item.icon}
                </div>
                <span className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6" id="problem">
        <div className="max-w-[1600px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#7C3AED' }}>The Problem</p>
              <h2 className="font-black leading-tight" style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-1.5px' }}>
                Digital proof is easy to copy.<br />
                <span className="gradient-text">Trust shouldn't be.</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <FileX size={22} />, title: 'Fake Documents', desc: 'Forged certificates and credentials are nearly indistinguishable from authentic ones without cryptographic verification.' },
              { icon: <AlertTriangle size={22} />, title: 'Modified Certificates', desc: 'Even a single character change in a document can go undetected without hash-based integrity checks.' },
              { icon: <UserX size={22} />, title: 'Identity Impersonation', desc: 'Unverified identities create security gaps in hiring, onboarding, and credential workflows.' },
              { icon: <Database size={22} />, title: 'No Audit Trail', desc: 'Traditional verification leaves no tamper-proof record of who verified what and when.' },
              { icon: <Globe size={22} />, title: 'Difficult Verification', desc: 'Verifying a credential typically requires manual review, emails, and phone calls — slow and error-prone.' },
              { icon: <Clock size={22} />, title: 'Expired Credentials', desc: 'Organizations have no automated way to detect and flag credentials that have passed their expiry date.' },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -4, borderColor: 'rgba(239,68,68,0.4)' }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl"
                  style={{ background: '#101722', border: '1px solid #1E293B' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {p.icon}
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#F8FAFC' }}>{p.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{p.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative" style={{ background: 'rgba(11,15,23,0.5)' }}>
        <div className="max-w-[1600px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#06B6D4' }}>The Solution</p>
              <h2 className="font-black leading-tight mb-4" style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-1.5px' }}>
                One platform for <span className="gradient-text">verifiable proof.</span>
              </h2>
            </div>
          </Reveal>
          <div className="flex flex-wrap items-center justify-center gap-0">
            {[
              { icon: <Upload size={20} />, label: 'Upload', color: '#7C3AED' },
              { icon: <Hash size={20} />, label: 'Hash', color: '#A78BFA' },
              { icon: <Eye size={20} />, label: 'Verify', color: '#06B6D4' },
              { icon: <Database size={20} />, label: 'Record', color: '#22D3EE' },
              { icon: <Share2 size={20} />, label: 'Share', color: '#22C55E' },
              { icon: <Clock size={20} />, label: 'Audit', color: '#F59E0B' },
            ].map((step, i, arr) => (
              <Reveal key={step.label} delay={i * 0.1}>
                <div className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.08, y: -4 }}
                    className="flex flex-col items-center gap-3 p-6"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: `${step.color}18`, border: `1px solid ${step.color}40`, color: step.color }}>
                      {step.icon}
                    </div>
                    <span className="text-sm font-bold" style={{ color: '#F8FAFC' }}>{step.label}</span>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <ChevronRight size={18} className="mx-2 flex-shrink-0" style={{ color: '#1E293B' }} />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" id="how-it-works">
        <div className="max-w-[1600px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#7C3AED' }}>Process</p>
              <h2 className="font-black leading-tight" style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-1.5px' }}>
                How ProofChain <span className="gradient-text">Works</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: <Upload size={24} />, title: 'Upload Proof', desc: 'Submit your document, certificate, or credential to ProofChain via a secure upload.' },
              { step: '02', icon: <Hash size={24} />, title: 'Generate Fingerprint', desc: 'A unique SHA-256 cryptographic hash is computed and recorded permanently on-chain.' },
              { step: '03', icon: <Shield size={24} />, title: 'Verify Integrity', desc: 'At any time, re-upload the document. ProofChain compares hashes and instantly detects tampering.' },
              { step: '04', icon: <Share2 size={24} />, title: 'Share Verified Proof', desc: 'Share a QR code or verification link. Anyone can verify authenticity without logging in.' },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="relative p-7 rounded-2xl group"
                  style={{ background: '#101722', border: '1px solid #1E293B' }}
                >
                  <div className="absolute top-7 right-7 text-5xl font-black opacity-10 leading-none"
                    style={{ color: '#7C3AED' }}>{s.step}</div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.25)' }}>
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: '#F8FAFC' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{s.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES ────────────────────────────────────────────── */}
      <section className="py-24 px-6" id="features" style={{ background: 'rgba(11,15,23,0.5)' }}>
        <div className="max-w-[1600px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#06B6D4' }}>Features</p>
              <h2 className="font-black leading-tight" style={{ fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '-1.5px' }}>
                Built for <span className="gradient-text">verifiable trust</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <FileSearch size={22} />, title: 'Document Verification', desc: 'Verify certificates, documents, credentials and digital records with cryptographic precision.', color: '#7C3AED' },
              { icon: <Hash size={22} />, title: 'Cryptographic Hashing', desc: 'Generate a unique SHA-256 fingerprint for every proof — tamper-proof and permanent.', color: '#06B6D4' },
              { icon: <QrCode size={22} />, title: 'QR Verification', desc: 'Verify any proof instantly using a scannable QR code — no login required.', color: '#22C55E' },
              { icon: <AlertTriangle size={22} />, title: 'Tamper Detection', desc: 'Instantly detect document modifications by comparing current vs. original fingerprints.', color: '#EF4444' },
              { icon: <Clock size={22} />, title: 'Verification History', desc: 'Maintain a transparent, immutable history of all verification events with full audit trail.', color: '#F59E0B' },
              { icon: <Award size={22} />, title: 'Digital Signatures', desc: 'Support trusted digital signatures from authorized issuers for maximum credibility.', color: '#A78BFA' },
              { icon: <TrendingUp size={22} />, title: 'Proof Expiry', desc: 'Automatically identify and flag expired credentials before they cause issues.', color: '#22D3EE' },
              { icon: <Lock size={22} />, title: 'Proof Revocation', desc: 'Allow authorized issuers to revoke proofs at any time with immediate effect.', color: '#F97316' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <motion.div
                  whileHover={{ y: -4, borderColor: `${f.color}40` }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-2xl h-full"
                  style={{ background: '#101722', border: '1px solid #1E293B' }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}15`, color: f.color, border: `1px solid ${f.color}30` }}>
                    {f.icon}
                  </div>
                  <h3 className="text-sm font-bold mb-2" style={{ color: '#F8FAFC' }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#94A3B8' }}>{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO VERIFICATION ───────────────────────────────────────── */}
      <section className="py-24 px-6" id="video-verification">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <Reveal>
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#7C3AED' }}>Video Verification</p>
                <h2 className="font-black leading-tight mb-6" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1.5px' }}>
                  Add human proof<br />to <span className="gradient-text">digital proof.</span>
                </h2>
                <p className="text-base leading-relaxed mb-8" style={{ color: '#94A3B8' }}>
                  Strengthen verification with secure video evidence linked directly to a digital proof. Record a challenge response or upload an existing video — ProofChain hashes and stores it privately.
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    'Secure verification challenge prompts',
                    'SHA-256 video hash generated server-side',
                    'All checks clearly labeled — no false AI claims',
                    'Private storage with authenticated access only',
                    'Full audit log of every video access',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: '#94A3B8' }}>
                      <CheckCircle size={16} color="#22C55E" className="flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to="/dashboard/video-verification" className="btn-primary no-underline">
                  Try Video Verification <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>

            {/* Right — UI Mockup */}
            <Reveal delay={0.2}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl opacity-20"
                  style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }} />
                <div className="relative p-6 rounded-2xl"
                  style={{ background: '#101722', border: '1px solid rgba(124,58,237,0.3)' }}>
                  {/* Top */}
                  <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid #1E293B' }}>
                    <div className="text-sm font-bold" style={{ color: '#F8FAFC' }}>VIDEO VERIFICATION</div>
                    <span className="badge-registered text-xs">ACTIVE</span>
                  </div>

                  {/* Challenge */}
                  <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderLeft: '3px solid #7C3AED' }}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#A78BFA' }}>Verification Challenge</div>
                    <div className="text-sm font-semibold italic" style={{ color: '#F8FAFC' }}>
                      "Please look at the camera and say: I am verifying this proof."
                    </div>
                  </div>

                  {/* Camera box */}
                  <div className="relative rounded-xl overflow-hidden mb-4 flex items-center justify-center"
                    style={{ background: 'rgba(5,7,11,0.9)', border: '1px solid #1E293B', height: '140px' }}>
                    <div className="flex flex-col items-center gap-3">
                      <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
                        <Video size={16} color="#EF4444" />
                      </motion.div>
                      <div className="text-xs" style={{ color: '#475569' }}>CAMERA PREVIEW</div>
                    </div>
                    {/* REC indicator */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.7)' }}>
                      <div className="w-2 h-2 rounded-full bg-red-500 rec-dot" />
                      <span className="text-xs font-bold" style={{ color: '#EF4444' }}>REC</span>
                    </div>
                    <div className="absolute top-3 right-3 text-xs font-mono px-2 py-1 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.7)', color: '#F8FAFC' }}>
                      00:08 / 00:15
                    </div>
                  </div>

                  {/* Result checks */}
                  <div className="space-y-2">
                    {[
                      { label: 'Video Integrity', status: 'PASS' },
                      { label: 'Challenge Response', status: 'PASS' },
                      { label: 'Video Hash', status: 'Generated' },
                      { label: 'Face Presence', status: 'User Reported' },
                    ].map(c => (
                      <div key={c.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ background: 'rgba(5,7,11,0.6)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <span className="text-xs" style={{ color: '#94A3B8' }}>{c.label}</span>
                        <span className="text-xs font-bold"
                          style={{ color: c.status === 'PASS' || c.status === 'Generated' ? '#22C55E' : '#94A3B8' }}>
                          {c.status === 'PASS' || c.status === 'Generated' ? '✓ ' : ''}{c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── SECURITY ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ background: 'rgba(11,15,23,0.6)' }}>
        <div className="max-w-[1600px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#06B6D4' }}>Security Architecture</p>
              <h2 className="font-black leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1.5px' }}>
                Security at every <span className="gradient-text">layer</span>
              </h2>
            </div>
          </Reveal>
          <div className="flex flex-col items-center gap-0 max-w-sm mx-auto">
            {[
              { layer: 'User', icon: <User size={16} /> },
              { layer: 'Authentication', icon: <Lock size={16} /> },
              { layer: 'Proof Upload', icon: <Upload size={16} /> },
              { layer: 'Hash Generation', icon: <Hash size={16} /> },
              { layer: 'Verification Engine', icon: <Shield size={16} /> },
              { layer: 'Secure Storage', icon: <Database size={16} /> },
              { layer: 'Audit Log', icon: <Clock size={16} /> },
              { layer: 'Public Verification', icon: <Globe size={16} /> },
            ].map((layer, i) => (
              <Reveal key={layer.layer} delay={i * 0.08}>
                <div className="flex flex-col items-center w-full">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    className="flex items-center gap-3 px-6 py-3 rounded-xl w-72"
                    style={{ background: '#101722', border: '1px solid #1E293B' }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA' }}>
                      {layer.icon}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{layer.layer}</span>
                  </motion.div>
                  {i < 7 && (
                    <div className="w-px h-6 mt-0" style={{ background: 'linear-gradient(180deg, #7C3AED, #06B6D4)' }} />
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-[1600px] mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#7C3AED' }}>Use Cases</p>
              <h2 className="font-black leading-tight" style={{ fontSize: 'clamp(28px, 4vw, 48px)', letterSpacing: '-1.5px' }}>
                Who uses <span className="gradient-text">ProofChain?</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <GraduationCap size={24} />, title: 'Education', desc: 'Verify academic certificates, degrees, and transcripts with cryptographic certainty. Eliminate fake credential fraud instantly.', color: '#7C3AED' },
              { icon: <Briefcase size={24} />, title: 'Hiring', desc: 'Verify candidate credentials, work experience, and professional certifications before extending offers.', color: '#06B6D4' },
              { icon: <Building2 size={24} />, title: 'Enterprise', desc: 'Manage internal compliance records, legal documents, and audit-ready digital evidence with full chain of custody.', color: '#22C55E' },
              { icon: <User size={24} />, title: 'Freelancers', desc: 'Build a verifiable portfolio of skills, certifications, and project credentials that clients can independently verify.', color: '#F59E0B' },
              { icon: <Calendar size={24} />, title: 'Events', desc: 'Issue and verify participation certificates, speaker credentials, and digital badges for conferences and events.', color: '#EF4444' },
              { icon: <Shield size={24} />, title: 'Digital Identity', desc: 'Build secure, proof-based digital identity workflows with video verification and challenge-response protocols.', color: '#A78BFA' },
            ].map((uc, i) => (
              <Reveal key={uc.title} delay={i * 0.08}>
                <motion.div
                  whileHover={{ y: -5, borderColor: `${uc.color}45` }}
                  transition={{ duration: 0.2 }}
                  className="p-7 rounded-2xl"
                  style={{ background: '#101722', border: '1px solid #1E293B' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${uc.color}15`, color: uc.color, border: `1px solid ${uc.color}30` }}>
                    {uc.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: '#F8FAFC' }}>{uc.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{uc.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" id="faq" style={{ background: 'rgba(11,15,23,0.5)' }}>
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: '#7C3AED' }}>FAQ</p>
              <h2 className="font-black" style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-1.5px' }}>
                Common <span className="gradient-text">questions</span>
              </h2>
            </div>
          </Reveal>
          <div>
            {FAQS.map(faq => <FAQItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-20" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, #7C3AED 0%, transparent 70%)' }}
          />
        </div>
        <Reveal>
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#A78BFA' }}>
              <Star size={14} fill="#A78BFA" />
              <span className="text-sm font-semibold">Start verifying in minutes</span>
            </div>
            <h2 className="font-black mb-6" style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-2px' }}>
              Ready to make proof<br /><span className="gradient-text">verifiable?</span>
            </h2>
            <p className="text-lg mb-10" style={{ color: '#94A3B8' }}>
              Build trust with secure, tamper-aware digital verification.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/sign-up" className="btn-primary text-base no-underline px-8 py-3.5">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/dashboard" className="btn-secondary text-base no-underline px-8 py-3.5">
                Explore ProofChain
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  )
}
