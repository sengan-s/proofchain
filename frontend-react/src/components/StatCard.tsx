// src/components/StatCard.tsx
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  color?: string
  sub?: string
  onClick?: () => void
}

export function StatCard({ label, value, icon, color = '#7C3AED', sub, onClick }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: `${color}50` }}
      transition={{ duration: 0.2 }}
      className="stat-card cursor-pointer"
      style={{ borderColor: '#1E293B' }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: '#94A3B8' }}>{label}</p>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold mb-1" style={{ color: '#F8FAFC' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: '#475569' }}>{sub}</p>}
    </motion.div>
  )
}

// src/components/VerificationStatus.tsx
export function VerificationStatus({ status }: { status: string }) {
  const s = status?.toUpperCase()
  const config: Record<string, { color: string; bg: string; border: string; label: string }> = {
    VERIFIED:   { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: '✓ VERIFIED' },
    AUTHENTIC:  { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: '✓ AUTHENTIC' },
    PASS:       { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: '✓ PASS' },
    TAMPERED:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: '✕ TAMPERED' },
    FAILED:     { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: '✕ FAILED' },
    REVOKED:    { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', label: '✕ REVOKED' },
    PENDING:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', label: '⏳ PENDING' },
    REGISTERED: { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', label: '● REGISTERED' },
  }
  const c = config[s] || { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: s }
  return (
    <span className="inline-flex items-center text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}>
      {c.label}
    </span>
  )
}
