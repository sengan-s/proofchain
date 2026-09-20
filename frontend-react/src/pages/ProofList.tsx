// src/pages/ProofList.tsx
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Upload, FileText, ChevronRight, RefreshCw } from 'lucide-react'
import { evidenceService, type EvidenceRecord } from '../services/api'
import { VerificationStatus } from '../components/StatCard'
import { truncateHash, formatDate } from '../lib/utils'

const EVIDENCE_TYPES = ['', 'Document', 'Image', 'Video', 'Audio', 'Digital Data', 'Physical Evidence']
const STATUS_OPTIONS = ['', 'REGISTERED', 'VERIFIED', 'TAMPERED']

export function ProofList() {
  const [records, setRecords] = useState<EvidenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const status = searchParams.get('status') || ''
    setStatusFilter(status)
  }, [searchParams])

  useEffect(() => {
    const debounce = setTimeout(load, 300)
    return () => clearTimeout(debounce)
  }, [search, typeFilter, statusFilter])

  async function load() {
    setLoading(true)
    try {
      const data = await evidenceService.getList({ search, type: typeFilter, status: statusFilter })
      setRecords(data)
    } catch { setRecords([]) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#F8FAFC', letterSpacing: '-0.5px' }}>All Proofs</h1>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>{records.length} evidence records found</p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="btn-secondary text-sm" style={{ padding: '0.55rem 1rem' }}>
            <RefreshCw size={14} />
          </button>
          <Link to="/dashboard/verification" className="btn-primary no-underline text-sm">
            <Upload size={15} /> Register Proof
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
          <input type="text" className="input-field pl-9" placeholder="Search by ID, title, case..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field sm:w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {EVIDENCE_TYPES.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input-field sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#101722', border: '1px solid #1E293B' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #1E293B' }}>
                {['Proof ID', 'Title', 'Type', 'Case ID', 'Hash', 'Date', 'Status', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded animate-pulse" style={{ background: '#1E293B', width: j === 0 ? '80px' : j === 7 ? '40px' : '120px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <FileText size={36} className="mx-auto mb-3" style={{ color: '#1E293B' }} />
                    <p className="text-base font-semibold mb-1" style={{ color: '#475569' }}>No proofs found</p>
                    <p className="text-sm mb-4" style={{ color: '#475569' }}>
                      {search || typeFilter || statusFilter ? 'Try adjusting your filters.' : 'Upload your first proof to get started.'}
                    </p>
                    <Link to="/dashboard/verification" className="btn-primary no-underline text-sm">
                      Upload First Proof →
                    </Link>
                  </td>
                </tr>
              ) : (
                records.map((ev, i) => (
                  <motion.tr
                    key={ev.evidence_id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid rgba(30,41,59,0.5)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(30,41,59,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-4">
                      <span className="text-sm font-mono font-bold" style={{ color: '#A78BFA' }}>{ev.evidence_id}</span>
                    </td>
                    <td className="px-5 py-4" style={{ maxWidth: '160px' }}>
                      <span className="text-sm font-medium truncate block" style={{ color: '#F8FAFC' }}>{ev.title}</span>
                      <span className="text-xs truncate block" style={{ color: '#475569' }}>{ev.original_filename}</span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#94A3B8' }}>{ev.evidence_type}</td>
                    <td className="px-5 py-4 text-sm font-mono" style={{ color: '#475569' }}>{ev.case_id}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono" style={{ color: '#475569' }}>{truncateHash(ev.file_hash, 6, 4)}</span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: '#475569' }}>{formatDate(ev.created_at)}</td>
                    <td className="px-5 py-4">
                      <VerificationStatus status={ev.status} />
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/dashboard/proofs/${ev.evidence_id}`}
                        className="flex items-center gap-1 text-xs font-semibold no-underline"
                        style={{ color: '#7C3AED' }}>
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
