// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Shield, AlertTriangle, Clock, Video, TrendingUp, Activity, Zap } from 'lucide-react'
import { dashboardService, type DashboardStats } from '../services/api'
import { StatCard } from '../components/StatCard'
import { VerificationStatus } from '../components/StatCard'
import { truncateHash, formatDate } from '../lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const MOCK_CHART_DATA = [
  { name: 'Mon', verified: 12, failed: 2 },
  { name: 'Tue', verified: 18, failed: 1 },
  { name: 'Wed', verified: 8, failed: 3 },
  { name: 'Thu', verified: 22, failed: 0 },
  { name: 'Fri', verified: 15, failed: 2 },
  { name: 'Sat', verified: 6, failed: 1 },
  { name: 'Sun', verified: 27, failed: 4 },
]

function SkeletonCard() {
  return (
    <div className="stat-card animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-4 w-24 rounded" style={{ background: '#1E293B' }} />
        <div className="w-9 h-9 rounded-lg" style={{ background: '#1E293B' }} />
      </div>
      <div className="h-8 w-16 rounded mb-1" style={{ background: '#1E293B' }} />
      <div className="h-3 w-20 rounded" style={{ background: '#1E293B' }} />
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSeed() {
    setSeeding(true)
    try { await dashboardService.seedDemo(); await load() } catch {}
    setSeeding(false)
  }

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#F8FAFC', letterSpacing: '-0.5px' }}>Overview</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Your ProofChain verification platform</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSeed} disabled={seeding}
            className="btn-secondary text-sm" style={{ opacity: seeding ? 0.6 : 1 }}>
            {seeding ? 'Seeding...' : '🌱 Seed Demo Data'}
          </button>
          <Link to="/dashboard/proofs" className="btn-primary no-underline text-sm">
            <FileText size={15} /> View Proofs
          </Link>
        </div>
      </div>

      {/* Blockchain status */}
      {stats?.blockchain && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm"
          style={{
            background: stats.blockchain.connected ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${stats.blockchain.connected ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
          }}>
          <div className="w-2 h-2 rounded-full" style={{ background: stats.blockchain.connected ? '#22C55E' : '#EF4444', animation: 'pulse 2s ease infinite' }} />
          <span style={{ color: stats.blockchain.connected ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
            {stats.blockchain.connected ? 'Blockchain Connected' : 'Blockchain Offline'}
          </span>
          <span style={{ color: '#475569' }}>
            {stats.blockchain.contract_address ? `· Contract: ${stats.blockchain.contract_address.substring(0, 14)}...` : ''}
            {stats.blockchain.block_number ? ` · Block #${stats.blockchain.block_number}` : ''}
          </span>
        </motion.div>
      )}

      {/* Stat Cards */}
      {error ? (
        <div className="p-6 rounded-xl text-center" style={{ background: '#101722', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-sm mb-3" style={{ color: '#EF4444' }}>{error}</p>
          <button onClick={load} className="btn-secondary text-sm">Try Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Total Evidence" value={stats?.total_evidence ?? 0} icon={<FileText size={18} />} color="#7C3AED" />
              <StatCard label="Verified" value={stats?.verified_evidence ?? 0} icon={<Shield size={18} />} color="#22C55E" />
              <StatCard label="Tampering Detected" value={stats?.tampering_detected ?? 0} icon={<AlertTriangle size={18} />} color="#EF4444" />
              <StatCard label="Pending" value={stats?.pending_evidence ?? 0} icon={<Clock size={18} />} color="#F59E0B" />
              <StatCard
                label="Video Verifications"
                value={stats?.video_verifications?.total ?? 0}
                icon={<Video size={18} />}
                color="#A78BFA"
                sub={`✓ ${stats?.video_verifications?.verified ?? 0}  ⏳ ${stats?.video_verifications?.pending ?? 0}  ✕ ${stats?.video_verifications?.failed ?? 0}`}
                onClick={() => {}}
              />
            </>
          )}
        </div>
      )}

      {/* Charts + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold" style={{ color: '#F8FAFC' }}>Verification Activity</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }} /> Verified
              </span>
              <span className="flex items-center gap-1.5" style={{ color: '#94A3B8' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} /> Failed
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="gVerified" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,41,59,0.6)" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#0B0F17', border: '1px solid #1E293B', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
                itemStyle={{ color: '#F8FAFC' }}
              />
              <Area type="monotone" dataKey="verified" stroke="#22C55E" strokeWidth={2} fill="url(#gVerified)" />
              <Area type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} fill="url(#gFailed)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold" style={{ color: '#F8FAFC' }}>Recent Activity</h3>
            <Link to="/dashboard/activity" className="text-xs no-underline" style={{ color: '#7C3AED' }}>View all</Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full" style={{ background: '#1E293B' }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded" style={{ background: '#1E293B' }} />
                    <div className="h-2.5 w-1/2 rounded" style={{ background: '#1E293B' }} />
                  </div>
                </div>
              ))
            ) : stats?.recent_verifications?.length ? (
              stats.recent_verifications.slice(0, 6).map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: v.status === 'AUTHENTIC' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${v.status === 'AUTHENTIC' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                    {v.status === 'AUTHENTIC'
                      ? <Shield size={14} color="#22C55E" />
                      : <AlertTriangle size={14} color="#EF4444" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F8FAFC' }}>
                      {v.status === 'AUTHENTIC' ? 'Evidence verified' : 'Tampering detected'}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#475569' }}>
                      {v.evidence_id} · {v.verified_by}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity size={28} className="mx-auto mb-2" style={{ color: '#1E293B' }} />
                <p className="text-sm" style={{ color: '#475569' }}>No activity yet</p>
                <button onClick={handleSeed} className="text-xs mt-2" style={{ color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Seed demo data →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Evidence */}
      {stats?.recent_evidence && stats.recent_evidence.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#101722', border: '1px solid #1E293B' }}>
          <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: '1px solid #1E293B' }}>
            <h3 className="font-bold" style={{ color: '#F8FAFC' }}>Recent Evidence</h3>
            <Link to="/dashboard/proofs" className="text-xs no-underline" style={{ color: '#7C3AED' }}>View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  {['Evidence ID', 'Title', 'Type', 'Hash', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_evidence.map((ev, i) => (
                  <motion.tr
                    key={ev.evidence_id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono font-bold" style={{ color: '#A78BFA' }}>{ev.evidence_id}</span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#F8FAFC', maxWidth: '180px' }}>
                      <span className="truncate block">{ev.title}</span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: '#94A3B8' }}>{ev.evidence_type}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono" style={{ color: '#475569' }}>{truncateHash(ev.file_hash, 6, 6)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <VerificationStatus status={ev.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/dashboard/proofs/${ev.evidence_id}`}
                        className="text-xs font-semibold no-underline px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: '#7C3AED', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                        View →
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
