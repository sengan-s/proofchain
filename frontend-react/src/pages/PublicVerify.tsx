// src/pages/PublicVerify.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, FileText, CheckCircle, AlertTriangle, Hash, Clock, MapPin, Search } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { evidenceService, type EvidenceRecord } from '../services/api'
import { truncateHash, formatDate } from '../lib/utils'

export function PublicVerify() {
  const { proofId } = useParams<{ proofId: string }>()
  const [data, setData] = useState<{ evidence: EvidenceRecord; blockchain: any } | null>(null)
  const [loading, setLoading] = useState(!!proofId)
  const [searchId, setSearchId] = useState(proofId || '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (proofId) load(proofId)
  }, [proofId])

  async function load(id: string) {
    setLoading(true)
    setError('')
    try {
      const res = await evidenceService.getById(id)
      setData(res)
    } catch {
      setError('Proof not found or is invalid.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchId) load(searchId)
  }

  const isVerified = data?.evidence.status === 'VERIFIED' || data?.evidence.status === 'AUTHENTIC'
  const isTampered = data?.evidence.status === 'TAMPERED'

  return (
    <div className="min-h-screen" style={{ background: '#05070B' }}>
      {/* Header */}
      <header className="p-6 border-b" style={{ background: '#0B0F17', borderColor: '#1E293B' }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
              <Shield size={16} color="white" fill="white" />
            </div>
            <span className="font-bold text-lg" style={{ color: '#F8FAFC' }}>ProofChain</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Public Verification Portal
          </div>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto py-12">
        {!data && !loading && (
          <div className="max-w-md mx-auto text-center mt-12">
            <Shield size={48} className="mx-auto mb-6 opacity-20" style={{ color: '#F8FAFC' }} />
            <h1 className="text-2xl font-black mb-3 text-white">Verify a Proof</h1>
            <p className="text-sm text-[#94A3B8] mb-8">Enter a Proof ID to verify its cryptographic integrity and authenticity.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input type="text" className="input-field" placeholder="PC-2026-X..." value={searchId} onChange={e => setSearchId(e.target.value)} />
              <button type="submit" className="btn-primary"><Search size={16} /></button>
            </form>
            {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4" style={{ borderColor: '#7C3AED transparent' }} />
            <p className="text-sm text-[#94A3B8]">Verifying cryptographic hashes...</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6 page-enter">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-black text-white mb-2">Verification Result</h1>
              <p className="text-sm text-[#94A3B8]">Independent verification via ProofChain</p>
            </div>

            <div className="p-8 rounded-3xl" style={{ background: '#101722', border: '1px solid #1E293B', boxShadow: isVerified ? '0 0 60px rgba(34,197,94,0.1)' : isTampered ? '0 0 60px rgba(239,68,68,0.15)' : 'none' }}>
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Result Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center ${isVerified ? 'bg-green-500/10 border-4 border-green-500/30 text-green-500' : isTampered ? 'bg-red-500/10 border-4 border-red-500/30 text-red-500' : 'bg-gray-500/10 border-4 border-gray-500/30 text-gray-500'}`}>
                    {isVerified ? <CheckCircle size={64} /> : isTampered ? <AlertTriangle size={64} /> : <Shield size={64} />}
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left w-full">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider mb-4 ${isVerified ? 'bg-green-500/20 text-green-500' : isTampered ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {isVerified ? '✓ VERIFIED BY PROOFCHAIN' : isTampered ? '✕ TAMPERED OR INVALID' : 'PENDING'}
                  </div>
                  <h2 className="text-3xl font-black text-white mb-2">{data.evidence.title}</h2>
                  <p className="text-lg text-[#94A3B8] mb-6">ID: {data.evidence.evidence_id}</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-[#05070B] border border-[#1E293B]">
                      <p className="text-xs text-[#475569] uppercase font-bold mb-1">Issuer / Collector</p>
                      <p className="text-sm font-semibold text-white truncate">{data.evidence.collector}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#05070B] border border-[#1E293B]">
                      <p className="text-xs text-[#475569] uppercase font-bold mb-1">Date Recorded</p>
                      <p className="text-sm font-semibold text-white">{formatDate(data.evidence.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-[#1E293B]">
                <h3 className="text-sm font-bold text-[#A78BFA] mb-4">Cryptographic Identity</h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#05070B] border border-[#1E293B]">
                    <span className="text-xs text-[#94A3B8] mb-1 sm:mb-0">SHA-256 Checksum</span>
                    <span className="text-xs font-mono text-[#06B6D4] break-all">{data.evidence.file_hash}</span>
                  </div>
                  {data.blockchain?.found && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#05070B] border border-[#1E293B]">
                      <span className="text-xs text-[#94A3B8] mb-1 sm:mb-0">Blockchain Anchored</span>
                      <span className="text-xs font-mono text-[#94A3B8] break-all flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-500" /> Block #{data.evidence.block_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 bg-[#101722] rounded-3xl border border-[#1E293B]">
              <p className="text-xs uppercase font-bold text-[#475569] mb-4 tracking-wider">Verification QR</p>
              <div className="p-3 bg-white rounded-xl mb-4">
                <QRCodeSVG value={window.location.href} size={120} level="H" />
              </div>
              <p className="text-xs text-[#94A3B8]">Scan to verify anywhere</p>
            </div>
            
            <div className="text-center">
               <button onClick={() => { setData(null); setSearchId(''); setError('') }} className="btn-secondary">Verify Another Proof</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
