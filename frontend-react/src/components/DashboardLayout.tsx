// src/components/DashboardLayout.tsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'
import { DashboardSidebar, MobileSidebar } from './DashboardSidebar'
import { useAuth } from '../context/AuthContext'

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen" style={{ background: '#05070B' }}>
      <DashboardSidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b"
          style={{ background: '#0B0F17', borderColor: '#1E293B', position: 'sticky', top: 0, zIndex: 30 }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
              <Menu size={22} />
            </button>
            <span className="font-bold text-base" style={{ color: '#F8FAFC' }}>ProofChain</span>
          </div>
          <div className="flex items-center gap-2">
            <button style={{ background: 'rgba(30,41,59,0.5)', border: 'none', borderRadius: '8px', padding: '6px', color: '#94A3B8', cursor: 'pointer' }}>
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: '#fff' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b"
          style={{ background: 'rgba(5,7,11,0.8)', borderColor: '#1E293B', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
          <div />
          <div className="flex items-center gap-3">
            <button style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid #1E293B', borderRadius: '8px', padding: '7px', color: '#94A3B8', cursor: 'pointer' }}>
              <Bell size={17} />
            </button>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(30,41,59,0.4)', border: '1px solid #1E293B' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: '#fff' }}>
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{user?.username}</span>
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.3)' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
