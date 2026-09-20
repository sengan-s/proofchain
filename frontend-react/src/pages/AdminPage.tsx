// src/pages/AdminPage.tsx
import { Shield, Users, Server, AlertTriangle } from 'lucide-react'
import { StatCard } from '../components/StatCard'

export function AdminPage() {
  return (
    <div className="space-y-6 page-enter max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-[#F8FAFC]">Admin Dashboard</h1>
        <p className="text-sm mt-1 text-[#94A3B8]">System configuration and user management.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value="14" icon={<Users size={18} />} color="#06B6D4" />
        <StatCard label="Active Sessions" value="3" icon={<Server size={18} />} color="#22C55E" />
        <StatCard label="System Alerts" value="0" icon={<AlertTriangle size={18} />} color="#F59E0B" />
        <StatCard label="API Requests" value="1.2k" icon={<Shield size={18} />} color="#7C3AED" />
      </div>

      <div className="p-8 rounded-2xl bg-[#101722] border border-[#1E293B] text-center">
        <Shield size={48} className="mx-auto mb-4 text-[#1E293B]" />
        <h2 className="text-lg font-bold text-white mb-2">Role-Based Access Control</h2>
        <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
          You are viewing this page because you have the <strong>Admin</strong> role. 
          User management and system configuration interfaces will be populated here as backend endpoints are added.
        </p>
      </div>
    </div>
  )
}
