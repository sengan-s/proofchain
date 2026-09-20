// src/pages/ProofDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Clock, Hash, MapPin, User, FileText, Activity, Video, Download, QrCode, AlertTriangle, ExternalLink } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { evidenceService, type EvidenceRecord, type CustodyEvent, type VideoVerification } from '../services/api'
import { VerificationStatus } from '../components/StatCard'
import { truncateHash, formatDate } from '../lib/utils'

export function ProofDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<{ evidence: EvidenceRecord; custody: CustodyEvent[]; blockchain: any } | null>(null)
  const [videos, setVideos] = useState<VideoVerification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      evidenceService.getById(id),
      evidenceService.getVideoVerifications(id).catch(() => [])
    ])
    .then(([details, vids]) => {
      setData(details)
      setVideos(vids)
    })
    .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#7C3AED transparent' }} />
      </div>
    )
  }

  if (!data?.evidence) {
    return (
      <div className="p-8 rounded-2xl text-center" style={{ background: '#101722', border: '1px solid #1E293B' }}>
        <AlertTriangle size={36} className="mx-auto mb-4" style={{ color: '#EF4444' }} />
        <h2 className="text-xl font-bold mb-2">Proof Not Found</h2>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>The evidence ID {id} could not be found.</p>
        <Link to="/dashboard/proofs" className="btn-secondary no-underline">Return to Proofs</Link>
      </div>
    )
  }

  const { evidence, custody, blockchain } = data
  const verifyUrl = `${window.location.origin}/verify/${evidence.evidence_id}`

  return (
    <div className="space-y-6 page-enter max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl"
        style={{ background: '#101722', border: '1px solid #1E293B' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold" style={{ color: '#F8FAFC' }}>{evidence.title}</h1>
              <VerificationStatus status={evidence.status} />
            </div>
            <p className="text-sm font-mono" style={{ color: '#94A3B8' }}>ID: {evidence.evidence_id} • Case: {evidence.case_id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/dashboard/video-verification?proof=${evidence.evidence_id}`} className="btn-secondary no-underline text-sm py-2">
            <Video size={14} /> Add Video
          </Link>
          <a href={verifyUrl} target="_blank" rel="noreferrer" className="btn-secondary no-underline text-sm py-2">
            <ExternalLink size={14} /> Public Page
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-5 pb-4" style={{ color: '#475569', borderBottom: '1px solid #1E293B' }}>
              Document Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <div>
                <p className="text-xs mb-1" style={{ color: '#475569' }}>Type</p>
                <p className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{evidence.evidence_type}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#475569' }}>Filename</p>
                <p className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{evidence.original_filename}</p>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#475569' }}>Collector / Issuer</p>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#F8FAFC' }}>
                  <User size={14} color="#94A3B8" /> {evidence.collector}
                </div>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#475569' }}>Location</p>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#F8FAFC' }}>
                  <MapPin size={14} color="#94A3B8" /> {evidence.location}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs mb-1" style={{ color: '#475569' }}>Cryptographic Hash (SHA-256)</p>
                <div className="flex items-center gap-3 p-3 rounded-lg mt-1" style={{ background: 'rgba(5,7,11,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Hash size={14} color="#06B6D4" />
                  <span className="text-xs font-mono break-all" style={{ color: '#22D3EE' }}>{evidence.file_hash}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Video Verifications */}
          <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid #1E293B' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                Video Verifications
              </h2>
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}>
                {videos.length} Records
              </span>
            </div>
            
            {videos.length === 0 ? (
              <div className="text-center py-6">
                <Video size={24} className="mx-auto mb-2" style={{ color: '#1E293B' }} />
                <p className="text-sm mb-3" style={{ color: '#94A3B8' }}>No video verifications attached to this proof.</p>
                <Link to={`/dashboard/video-verification?proof=${evidence.evidence_id}`} className="text-xs no-underline font-semibold" style={{ color: '#7C3AED' }}>
                  Add Video Verification →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map(v => (
                  <div key={v.id} className="p-4 rounded-xl flex items-center justify-between gap-4"
                    style={{ background: 'rgba(5,7,11,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: v.overall_status === 'VERIFIED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                        <Video size={16} color={v.overall_status === 'VERIFIED' ? '#22C55E' : '#EF4444'} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold" style={{ color: '#F8FAFC' }}>{v.verification_id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${v.overall_status === 'VERIFIED' ? 'bg-green-500/10 text-green-500 border border-green-500/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'}`}>
                            {v.overall_status}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: '#94A3B8' }}>{formatDate(v.created_at)} • {v.user_id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Blockchain Box */}
          <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield size={64} color="#7C3AED" />
            </div>
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: '#A78BFA' }}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Blockchain Record
            </h3>
            <div className="space-y-4 relative z-10">
              {blockchain?.found ? (
                <>
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Transaction Hash</p>
                    <a href="#" className="text-xs font-mono break-all hover:underline" style={{ color: '#7C3AED' }}>
                      {evidence.tx_hash}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Block Number</p>
                    <p className="text-sm font-medium" style={{ color: '#F8FAFC' }}>#{evidence.block_number}</p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#94A3B8' }}>Network Time</p>
                    <p className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{formatDate(evidence.created_at)}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-xs leading-relaxed">This record has not been anchored to the blockchain or the network is unreachable.</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="p-6 rounded-2xl flex flex-col items-center text-center" style={{ background: '#101722', border: '1px solid #1E293B' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>Public Verification</h3>
            <div className="p-3 bg-white rounded-xl mb-4">
              <QRCodeSVG value={verifyUrl} size={140} level="H" />
            </div>
            <p className="text-xs mb-4" style={{ color: '#94A3B8' }}>Scan to instantly verify authenticity</p>
            <button onClick={() => navigator.clipboard.writeText(verifyUrl)} className="w-full btn-secondary text-xs py-2 justify-center">
              Copy Link
            </button>
          </div>

          {/* Timeline / Custody */}
          <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-5 pb-4" style={{ color: '#475569', borderBottom: '1px solid #1E293B' }}>
              Audit Timeline
            </h3>
            <div className="space-y-0 pl-1">
              <div className="timeline-item">
                <div className="timeline-dot success"><Shield size={16} /></div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F8FAFC' }}>Proof Registered</p>
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{evidence.collector}</p>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: '#475569' }}>{formatDate(evidence.created_at)}</p>
                </div>
              </div>
              
              {custody?.map((event: CustodyEvent, i: number) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot">
                    <Activity size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#F8FAFC' }}>{event.action}</p>
                    <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>{event.person} ({event.role})</p>
                    {event.notes && <p className="text-xs italic mt-1" style={{ color: '#475569' }}>"{event.notes}"</p>}
                    <p className="text-[10px] mt-1 font-mono" style={{ color: '#475569' }}>
                      {new Date(event.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
