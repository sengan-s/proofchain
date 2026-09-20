import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { QrCode, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function QrVerify() {
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // Initialize Scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    )

    scannerRef.current.render(onScanSuccess, onScanFailure)

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [])

  const onScanSuccess = (decodedText: string) => {
    setScanResult(decodedText)
    setError(null)
    
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
    }

    // Attempt to navigate if it's a local verify URL
    try {
      const url = new URL(decodedText)
      if (url.pathname.startsWith('/verify/')) {
        setTimeout(() => navigate(url.pathname), 1500)
      } else {
        setError('QR Code does not contain a valid ProofChain verification link.')
      }
    } catch {
      // If it's not a full URL but just an Evidence ID like EVD-001
      if (decodedText.startsWith('EVD-') || decodedText.startsWith('CASE-')) {
        setTimeout(() => navigate(`/verify/${decodedText}`), 1500)
      } else {
        setError('Invalid QR Code format.')
      }
    }
  }

  const onScanFailure = (err: any) => {
    // frequent failure expected when no QR is in frame
  }

  const handleManualEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const url = fd.get('url') as string
    if (url) onScanSuccess(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA' }}>
          <QrCode size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">QR Verification</h1>
          <p className="text-[#94A3B8]">Scan a ProofChain QR code to instantly verify authenticity.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Scanner Panel */}
        <div className="p-6 rounded-2xl" style={{ background: '#0B0F17', border: '1px solid #1E293B' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Webcam Scanner</h2>
          {!scanResult && (
             <div className="rounded-lg overflow-hidden border border-[#1E293B]">
                <div id="qr-reader" className="w-full"></div>
             </div>
          )}

          {scanResult && !error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-8 text-center h-full">
              <CheckCircle size={48} className="text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">QR Code Detected</h3>
              <p className="text-[#94A3B8] mb-4">Navigating to verification page...</p>
              <div className="text-sm font-mono text-[#A78BFA] break-all p-3 rounded-lg bg-[rgba(124,58,237,0.1)]">
                {scanResult}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-xl flex gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-400 mb-1">Invalid QR Code</h4>
                <p className="text-sm text-red-300/80 mb-3">{error}</p>
                <button onClick={() => { setScanResult(null); setError(null); window.location.reload(); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors">
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Manual Entry Panel */}
        <div className="p-6 rounded-2xl" style={{ background: '#0B0F17', border: '1px solid #1E293B' }}>
          <h2 className="text-lg font-semibold text-white mb-4">Manual Entry</h2>
          <p className="text-sm text-[#94A3B8] mb-6">Cannot scan the QR code? Manually paste the verification link or Evidence ID below.</p>
          
          <form onSubmit={handleManualEntry} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">Verification URL or Evidence ID</label>
              <input type="text" name="url" placeholder="e.g. EVD-001 or http://..." required
                className="w-full bg-[#05070B] border border-[#1E293B] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#7C3AED] transition-colors" />
            </div>
            <button type="submit" className="w-full btn-primary py-3 justify-center">
              Verify Link
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
