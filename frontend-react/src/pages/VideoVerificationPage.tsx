// src/pages/VideoVerificationPage.tsx
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Video, Mic, CheckCircle, AlertTriangle, Play, StopCircle, UploadCloud, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { videoVerificationService, evidenceService } from '../services/api'
import { useAuth } from '../context/AuthContext'

export function VideoVerificationPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const proofId = searchParams.get('proof') || ''
  
  const [evidenceId, setEvidenceId] = useState(proofId)
  const [evidenceValid, setEvidenceValid] = useState<boolean | null>(null)
  const [challenges, setChallenges] = useState<string[]>([])
  const [challenge, setChallenge] = useState('')
  const [transcript, setTranscript] = useState('')
  
  // Recording state
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recording, setRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [timer, setTimer] = useState(0)
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    videoVerificationService.getChallenges().then(c => {
      setChallenges(c)
      if (c.length > 0) setChallenge(c[Math.floor(Math.random() * c.length)])
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (evidenceId.length >= 3) {
      const delay = setTimeout(() => {
        evidenceService.getById(evidenceId)
          .then(() => setEvidenceValid(true))
          .catch(() => setEvidenceValid(false))
      }, 500)
      return () => clearTimeout(delay)
    } else {
      setEvidenceValid(null)
    }
  }, [evidenceId])

  async function startCamera() {
    setError(''); setVideoBlob(null); setVideoUrl(''); setResult(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.muted = true
        videoRef.current.play()
      }
    } catch (err: any) { setError('Camera/Microphone access denied or unavailable.') }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function startRecording() {
    if (!stream) return
    const mr = new MediaRecorder(stream)
    const chunks: BlobPart[] = []
    mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
    }
    mr.start()
    setMediaRecorder(mr)
    setRecording(true)
    setTimer(0)
    timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000)
  }

  function stopRecording() {
    if (mediaRecorder && recording) {
      mediaRecorder.stop()
      setRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
      stopCamera()
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      const f = e.target.files[0]
      setVideoBlob(f)
      setVideoUrl(URL.createObjectURL(f))
      stopCamera()
    }
  }

  async function handleSubmit() {
    if (!videoBlob || !evidenceId || !challenge) return
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('video', videoBlob, 'verification.webm')
      fd.append('evidence_id', evidenceId)
      fd.append('challenge_text', challenge)
      fd.append('transcript', transcript)
      
      const res = await videoVerificationService.upload(fd)
      setResult(res)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { return () => stopCamera() }, []) // Cleanup

  return (
    <div className="max-w-5xl mx-auto space-y-8 page-enter">
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#F8FAFC', letterSpacing: '-0.5px' }}>Video Verification</h1>
        <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>Add human proof to digital proof. Record a challenge response to securely verify identity.</p>
      </div>

      {result ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${result.verification.overall_status === 'VERIFIED' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {result.verification.overall_status === 'VERIFIED' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ color: '#F8FAFC' }}>{result.verification.overall_status === 'VERIFIED' ? 'Verification Successful' : 'Verification Failed'}</h2>
            <p className="text-sm mb-8" style={{ color: '#94A3B8' }}>{result.message}</p>
            
            <div className="w-full space-y-3 mb-8 text-left">
              <div className="flex justify-between p-3 rounded-lg bg-[#05070B] border border-[#1E293B]">
                <span className="text-xs text-[#94A3B8]">Verification ID</span>
                <span className="text-xs font-mono font-bold text-[#A78BFA]">{result.verification.verification_id}</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-[#05070B] border border-[#1E293B]">
                <span className="text-xs text-[#94A3B8]">SHA-256 Video Hash</span>
                <span className="text-xs font-mono text-[#06B6D4] truncate ml-4">{result.verification.video_hash}</span>
              </div>
              
              <div className="pt-4 mt-4 border-t border-[#1E293B]">
                <h4 className="text-[10px] font-bold uppercase text-[#475569] tracking-wider mb-3">Verification Checks</h4>
                {result.checks.map((c: any) => (
                  <div key={c.name} className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium text-[#F8FAFC]">{c.name}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${c.status === 'PASS' ? 'bg-green-500/10 text-green-500' : c.status === 'FAIL' ? 'bg-red-500/10 text-red-500' : 'bg-gray-500/10 text-gray-400'}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-4 w-full">
              <button onClick={() => { setResult(null); setVideoBlob(null); setVideoUrl('') }} className="flex-1 btn-secondary justify-center">Verify Another</button>
              <Link to={`/dashboard/proofs/${result.evidence.evidence_id}`} className="flex-1 btn-primary justify-center text-center no-underline">View Evidence</Link>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Config */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5 pb-3" style={{ color: '#475569', borderBottom: '1px solid #1E293B' }}>Link Proof</h3>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[#94A3B8]">Evidence ID</label>
                <div className="relative">
                  <input type="text" className="input-field" placeholder="e.g. EVD-001" value={evidenceId} onChange={e => setEvidenceId(e.target.value.toUpperCase())} disabled={loading || !!videoBlob || !!stream} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {evidenceValid === true && <CheckCircle size={16} className="text-green-500" />}
                    {evidenceValid === false && <AlertTriangle size={16} className="text-red-500" />}
                  </div>
                </div>
                {evidenceValid === false && <p className="text-[10px] text-red-500 mt-1">Proof not found.</p>}
              </div>
            </div>

            <div className="p-6 rounded-2xl" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#A78BFA]">Verification Challenge</h3>
                <button onClick={() => setChallenge(challenges[Math.floor(Math.random() * challenges.length)])} className="text-[#A78BFA] hover:text-white bg-transparent border-none cursor-pointer" disabled={!!videoBlob || !!stream}>
                  <RefreshCw size={14} />
                </button>
              </div>
              <p className="text-sm font-semibold italic text-[#F8FAFC] leading-relaxed p-4 bg-[#0B0F17] rounded-xl border border-[#1E293B]">
                "{challenge || 'Please look at the camera and state your intent to verify.'}"
              </p>
            </div>
            
            <div className="p-6 rounded-2xl" style={{ background: '#101722', border: '1px solid #1E293B' }}>
              <label className="block text-sm font-bold uppercase tracking-wider mb-3 text-[#475569]">Spoken Response (Optional)</label>
              <textarea className="input-field min-h-[100px] resize-none" placeholder="Type what you said in the video for the transcript check..." value={transcript} onChange={e => setTranscript(e.target.value)} disabled={loading} />
            </div>
          </div>

          {/* Right Column: Camera */}
          <div className="p-6 rounded-2xl flex flex-col" style={{ background: '#101722', border: '1px solid #1E293B' }}>
            {error && (
              <div className="flex gap-2 p-3 rounded-lg mb-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="relative rounded-xl overflow-hidden bg-[#05070B] border border-[#1E293B] flex-1 min-h-[300px] flex items-center justify-center mb-6">
              {!stream && !videoUrl && (
                <div className="text-center p-6">
                  <div className="flex justify-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/20 text-[#A78BFA] flex items-center justify-center"><Video size={20} /></div>
                    <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center"><Mic size={20} /></div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">Camera & Microphone</h3>
                  <p className="text-xs text-[#94A3B8] max-w-xs mx-auto mb-6">You will be asked to grant permissions. Your video is processed securely.</p>
                  <div className="flex flex-col gap-3 max-w-[200px] mx-auto">
                    <button onClick={startCamera} className="btn-primary justify-center text-sm">Start Camera</button>
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary justify-center text-sm border-transparent bg-[#1E293B]/50">Upload File</button>
                    <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </div>
                </div>
              )}
              
              {(stream || videoUrl) && (
                <>
                  <video
                    ref={videoRef}
                    src={videoUrl || undefined}
                    autoPlay={!!stream}
                    controls={!!videoUrl}
                    className="w-full h-full object-cover"
                  />
                  {recording && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-mono font-bold text-red-500">REC</span>
                    </div>
                  )}
                  {recording && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <span className="text-xs font-mono font-bold text-white">00:{timer.toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {stream && !recording && (
                <button onClick={startRecording} className="btn-primary w-full justify-center py-3 bg-red-600 hover:bg-red-700">
                  <Play size={16} /> Record Video
                </button>
              )}
              {recording && (
                <button onClick={stopRecording} className="btn-secondary w-full justify-center py-3 border-red-500/50 hover:bg-red-500/10 text-red-400">
                  <StopCircle size={16} /> Stop Recording
                </button>
              )}
              {videoBlob && (
                <div className="flex gap-3">
                  <button onClick={() => { setVideoBlob(null); setVideoUrl(''); startCamera() }} className="btn-secondary flex-1 justify-center py-3" disabled={loading}>
                    Retake
                  </button>
                  <button onClick={handleSubmit} className="btn-primary flex-[2] justify-center py-3" disabled={loading || !evidenceValid}>
                    {loading ? 'Processing...' : 'Submit Verification'}
                  </button>
                </div>
              )}
              {!evidenceValid && videoBlob && (
                <p className="text-xs text-red-500 text-center">Please enter a valid Evidence ID first.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
