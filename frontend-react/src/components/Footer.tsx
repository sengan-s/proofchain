// src/components/Footer.tsx
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/#features' },
    { label: 'Verification', href: '/#how-it-works' },
    { label: 'Video Verification', href: '/#video-verification' },
    { label: 'Security', href: '/security' },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'Developers', href: '#' },
    { label: 'FAQ', href: '/#faq' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  Legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer style={{ background: '#05070B', borderTop: '1px solid #1E293B' }}>
      <div className="max-w-[1600px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                <Shield size={16} color="white" fill="white" />
              </div>
              <span className="font-bold text-lg" style={{ color: '#F8FAFC' }}>ProofChain</span>
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#94A3B8', maxWidth: '220px' }}>
              Verify. Prove. Trust.<br />
              Secure digital proof verification powered by cryptographic integrity.
            </p>
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full w-fit"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              System Operational
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-sm font-semibold mb-4" style={{ color: '#F8FAFC' }}>{group}</h4>
              <ul className="space-y-2.5" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {links.map(link => (
                  <li key={link.label}>
                    <a href={link.href}
                      className="text-sm no-underline transition-colors duration-200"
                      style={{ color: '#94A3B8' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#F8FAFC')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid #1E293B' }}>
          <p className="text-sm" style={{ color: '#475569' }}>
            © 2026 ProofChain. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-sm font-mono px-2 py-0.5 rounded"
              style={{ color: '#475569', background: 'rgba(30,41,59,0.5)', fontSize: '0.72rem' }}>
              v2.0.0
            </span>
            <span className="text-sm" style={{ color: '#475569' }}>
              Built with cryptographic integrity
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
