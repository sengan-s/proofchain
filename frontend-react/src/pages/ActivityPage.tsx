// src/pages/ActivityPage.tsx
import { useState, useEffect } from 'react'
import { Activity, Shield, AlertTriangle, Video, Search, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dashboardService, type Alert } from '../services/api'
import { formatDate, truncateHash } from '../lib/utils'

export function ActivityPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getAlerts().then(a => setAlerts(a)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 page-enter max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#F8FAFC]">Audit Trail & Security Alerts</h1>
        <p className="text-sm mt-1 text-[#94A3B8]">Immutable history of all verification events and tampering attempts.</p>
      </div>

      <div className="bg-[#101722] rounded-2xl border border-[#1E293B] overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-[#7C3AED]" /></div>
        ) : alerts.length === 0 ? (
          <div className="p-16 text-center">
            <Shield size={48} className="mx-auto mb-4 text-[#1E293B]" />
            <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">No Security Alerts</h3>
            <p className="text-sm text-[#94A3B8]">Your verification ecosystem is secure. No tampering has been detected.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {alerts.map((a, i) => (
              <div key={i} className="p-6 flex flex-col md:flex-row gap-6 hover:bg-[#0B0F17] transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-red-500 text-lg">Tampering Detected</h3>
                    <span className="text-xs text-[#94A3B8] font-mono">{formatDate(a.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#F8FAFC] mb-4">A document verification attempt failed. The submitted file's cryptographic hash does not match the original anchored on the blockchain.</p>
                  
                  <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#05070B] border border-[#1E293B] mb-4">
                    <div><span className="text-[10px] uppercase font-bold text-[#475569]">Evidence ID</span><p className="text-sm font-mono text-[#A78BFA]">{a.evidence_id}</p></div>
                    <div><span className="text-[10px] uppercase font-bold text-[#475569]">Attempted By</span><p className="text-sm font-medium text-[#F8FAFC]">{a.attempted_by}</p></div>
                    <div><span className="text-[10px] uppercase font-bold text-[#475569]">Original Hash</span><p className="text-xs font-mono text-[#06B6D4]">{truncateHash(a.original_hash, 12, 12)}</p></div>
                    <div><span className="text-[10px] uppercase font-bold text-[#475569]">Mismatch Hash</span><p className="text-xs font-mono text-red-400">{truncateHash(a.computed_hash, 12, 12)}</p></div>
                  </div>
                  
                  <Link to={`/dashboard/proofs/${a.evidence_id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#7C3AED] hover:text-[#A78BFA] transition-colors">
                    View Associated Proof <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
