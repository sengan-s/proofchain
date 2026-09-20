// src/pages/DocumentVerification.tsx
import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Shield, AlertTriangle, File, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { evidenceService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export function DocumentVerification() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'register' | 'verify'>('register')
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [caseId, setCaseId] = useState('')
  const [evType, setEvType] = useState('Document')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setFile(e.target.files[0])
    setResult(null)
    setError('')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title || !caseId) { setError('Please fill all required fields and upload a file.'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title)
      fd.append('case_id', caseId)
      fd.append('evidence_type', evType)
      fd.append('collector', user?.username || 'Unknown')
      fd.append('location', location)
      const res = await evidenceService.register(fd)
      setResult({ type: 'register', data: res })
      setFile(null); setTitle(''); setCaseId(''); setLocation('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Please select a file to verify.'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await evidenceService.verify(fd)
      setResult({ type: 'verify', data: res })
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 page-enter">
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#F8FAFC', letterSpacing: '-0.5px' }}>Document Verification</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Register new proofs or verify existing ones via cryptographic hashing.</p>
      </div>

      <div className="flex bg-[#101722] p-1 rounded-xl border border-[#1E293B] w-fit">
        <button
          className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
          onClick={() => { setActiveTab('register'); setResult(null); setError('') }}
        >
          Register Proof
        </button>
        <button
          className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'verify' ? 'bg-[#7C3AED] text-white shadow-lg' : 'text-[#94A3B8] hover:text-white'}`}
          onClick={() => { setActiveTab('verify'); setResult(null); setError('') }}
        >
          Verify Proof
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
          {error && (
            <div className="flex gap-2 p-3 rounded-lg mb-6 text-sm text-red-500 bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={activeTab === 'register' ? handleRegister : handleVerify} className="space-y-5">
            {/* File Upload Box */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Select File</label>
              <div
                className="border-2 border-dashed border-[#1E293B] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1e293b50] hover:border-[#7C3AED] transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <>
                    <File size={32} className="text-[#7C3AED] mb-3" />
                    <p className="text-sm font-semibold text-white break-all px-4">{file.name}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} className="text-[#475569] mb-3" />
                    <p className="text-sm font-semibold text-white">Click to upload document</p>
                    <p className="text-xs text-[#475569] mt-1">Any file format supported</p>
                  </>
                )}
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              </div>
            </div>

            {activeTab === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[#94A3B8]">Title</label>
                    <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Degree Cert" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[#94A3B8]">Case/Reference ID</label>
                    <input type="text" className="input-field" value={caseId} onChange={e => setCaseId(e.target.value)} placeholder="e.g. REF-001" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[#94A3B8]">Evidence Type</label>
                    <select className="input-field" value={evType} onChange={e => setEvType(e.target.value)}>
                      <option>Document</option><option>Image</option><option>Video</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-[#94A3B8]">Location</label>
                    <input type="text" className="input-field" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Cloud Storage" />
                  </div>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-3">
              {loading ? 'Processing...' : activeTab === 'register' ? 'Generate Hash & Register Proof' : 'Verify Integrity'}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="p-6 rounded-2xl flex flex-col" style={{ background: 'rgba(11,15,23,0.5)', border: '1px dashed #1E293B' }}>
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
              <Shield size={48} className="text-[#475569] mb-4" />
              <p className="text-sm font-semibold text-white">No Results Yet</p>
              <p className="text-xs text-[#94A3B8]">Submit a file to view cryptographic results here.</p>
            </div>
          ) : result.type === 'register' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center"><CheckCircle size={20} /></div>
                <div>
                  <h3 className="text-green-500 font-bold text-lg">Proof Registered</h3>
                  <p className="text-xs text-[#94A3B8]">Successfully anchored to blockchain.</p>
                </div>
              </div>
              <div className="space-y-3 p-4 bg-[#05070B] rounded-xl border border-[#1E293B]">
                <div><p className="text-[10px] text-[#475569] uppercase font-bold">Proof ID</p><p className="font-mono text-[#A78BFA]">{result.data.evidence.evidence_id}</p></div>
                <div><p className="text-[10px] text-[#475569] uppercase font-bold">Generated SHA-256 Hash</p><p className="font-mono text-[#06B6D4] text-xs break-all">{result.data.evidence.file_hash}</p></div>
                <div><p className="text-[10px] text-[#475569] uppercase font-bold">Transaction Hash</p><p className="font-mono text-[#94A3B8] text-xs break-all">{result.data.blockchain.tx_hash}</p></div>
              </div>
              <Link to={`/dashboard/proofs/${result.data.evidence.evidence_id}`} className="btn-secondary w-full justify-center">View Full Proof Details</Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${result.data.status === 'AUTHENTIC' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {result.data.status === 'AUTHENTIC' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${result.data.status === 'AUTHENTIC' ? 'text-green-500' : 'text-red-500'}`}>
                    {result.data.status === 'AUTHENTIC' ? 'Verification Passed' : 'Tampering Detected!'}
                  </h3>
                  <p className="text-xs text-[#94A3B8]">{result.data.result_message}</p>
                </div>
              </div>
              <div className="space-y-3 p-4 bg-[#05070B] rounded-xl border border-[#1E293B]">
                <div><p className="text-[10px] text-[#475569] uppercase font-bold">Computed Hash (Current File)</p><p className={`font-mono text-xs break-all ${result.data.status === 'AUTHENTIC' ? 'text-green-400' : 'text-red-400'}`}>{result.data.current_hash}</p></div>
                {result.data.original_hash && (
                  <div><p className="text-[10px] text-[#475569] uppercase font-bold">Original Hash (Blockchain)</p><p className="font-mono text-[#06B6D4] text-xs break-all">{result.data.original_hash}</p></div>
                )}
              </div>
              {result.data.evidence_id && (
                <Link to={`/dashboard/proofs/${result.data.evidence_id}`} className="btn-secondary w-full justify-center">View Evidence Record</Link>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
