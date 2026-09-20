// src/pages/SecurityPage.tsx
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Shield, Lock, Database, Upload, Hash, Clock, Globe, ArrowRight, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function Layer({ num, title, desc, icon }: { num: string; title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-[#7C3AED]">STEP {num}</span>
          <h3 className="text-base font-bold text-[#F8FAFC]">{title}</h3>
        </div>
        <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export function SecurityPage() {
  return (
    <div className="bg-[#05070B] min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-24 px-6 max-w-[1600px] mx-auto">
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Security <span className="gradient-text">Architecture</span></h1>
          <p className="text-lg text-[#94A3B8] leading-relaxed">
            ProofChain is built on the principle of zero-trust. Cryptographic hashing ensures that digital proofs cannot be tampered with without detection.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Verification Lifecycle</h2>
            <div className="space-y-10 relative">
              <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-[#7C3AED] to-[#06B6D4] opacity-30" />
              <Layer num="01" title="Authentication" desc="Users must authenticate via secure session tokens before accessing the ProofChain dashboard." icon={<Lock size={20} />} />
              <Layer num="02" title="Proof Upload" desc="Documents and video evidence are uploaded over secure HTTPS connections directly to isolated storage." icon={<Upload size={20} />} />
              <Layer num="03" title="Hash Generation" desc="The system computes a unique SHA-256 digital fingerprint of the exact byte sequence of the evidence." icon={<Hash size={20} />} />
              <Layer num="04" title="Verification Engine" desc="During verification, the engine recalculates the hash and compares it strictly against the original." icon={<Shield size={20} />} />
              <Layer num="05" title="Secure Storage" desc="Metadata and hashes are stored in SQLite/PostgreSQL, while on-chain anchoring ensures immutability." icon={<Database size={20} />} />
              <Layer num="06" title="Audit Log" desc="Every verification attempt, view, or state change is permanently logged with timestamps and user IDs." icon={<Clock size={20} />} />
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[#101722] border border-[#1E293B]">
            <h3 className="text-xl font-bold text-white mb-6">Core Security Features</h3>
            
            <div className="space-y-6">
              {[
                { title: 'Cryptographic Integrity', desc: 'SHA-256 hashes make it mathematically impossible to alter a document without detection.' },
                { title: 'Tamper Detection', desc: 'Even a single pixel or character change results in a completely different hash.' },
                { title: 'Video Verification Security', desc: 'Private video storage ensures biometric challenge-response data is never exposed publicly.' },
                { title: 'Proof Revocation', desc: 'Authorized issuers can instantly revoke proofs, updating the global verification status.' },
                { title: 'Public Verification', desc: 'The QR portal exposes only public metadata, maintaining privacy while allowing independent verification.' },
              ].map(f => (
                <div key={f.title} className="p-4 rounded-xl bg-[#05070B] border border-[#1E293B]">
                  <h4 className="text-sm font-bold text-[#A78BFA] mb-1">{f.title}</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <Link to="/sign-up" className="btn-primary w-full justify-center mt-8 py-3">
              Start Using ProofChain <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
