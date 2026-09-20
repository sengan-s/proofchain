// src/pages/AnalyticsPage.tsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { dashboardService } from '../services/api'
import { StatCard } from '../components/StatCard'
import { FileText, Shield, AlertTriangle, Video } from 'lucide-react'

const COLORS = ['#7C3AED', '#06B6D4', '#22C55E', '#F59E0B']

export function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getStats().then(s => setStats(s)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" /></div>

  const typeData = [
    { name: 'Document', value: stats?.total_evidence ? Math.floor(stats.total_evidence * 0.6) : 40 },
    { name: 'Video', value: stats?.video_verifications?.total || 15 },
    { name: 'Image', value: stats?.total_evidence ? Math.floor(stats.total_evidence * 0.2) : 10 },
    { name: 'Other', value: stats?.total_evidence ? Math.floor(stats.total_evidence * 0.2) : 10 },
  ]

  const monthlyData = [
    { name: 'Jan', proofs: 12 }, { name: 'Feb', proofs: 19 }, { name: 'Mar', proofs: 15 },
    { name: 'Apr', proofs: 28 }, { name: 'May', proofs: 22 }, { name: 'Jun', proofs: stats?.total_evidence || 30 },
  ]

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-black text-[#F8FAFC]">Analytics</h1>
        <p className="text-sm mt-1 text-[#94A3B8]">Deep insights into your verification volume and integrity rates.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Proofs" value={stats?.total_evidence || 0} icon={<FileText size={18} />} color="#7C3AED" />
        <StatCard label="Overall Integrity Rate" value="99.2%" icon={<Shield size={18} />} color="#22C55E" />
        <StatCard label="Tamper Attempts" value={stats?.tampering_detected || 0} icon={<AlertTriangle size={18} />} color="#EF4444" />
        <StatCard label="Video Verifications" value={stats?.video_verifications?.total || 0} icon={<Video size={18} />} color="#06B6D4" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#101722] border border-[#1E293B]">
          <h3 className="font-bold text-[#F8FAFC] mb-6">Verification Volume (YTD)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#475569" axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" axisLine={false} tickLine={false} />
              <RechartsTooltip contentStyle={{ background: '#0B0F17', border: '1px solid #1E293B', borderRadius: '8px' }} />
              <Bar dataKey="proofs" fill="url(#colorProofs)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorProofs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-2xl bg-[#101722] border border-[#1E293B]">
          <h3 className="font-bold text-[#F8FAFC] mb-6">Proof Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={{ background: '#0B0F17', border: '1px solid #1E293B', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {typeData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-sm text-[#94A3B8]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
