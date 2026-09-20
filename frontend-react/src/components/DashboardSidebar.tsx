// src/components/DashboardSidebar.tsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, FileText, Video, QrCode,
  History, BarChart3, Settings, Users, LogOut,
  ChevronDown, ChevronRight, Menu, X, Activity
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: NavItem[]
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard size={16} /> },
  {
    label: 'Verification', icon: <Shield size={16} />,
    children: [
      { label: 'Documents', href: '/dashboard/verification', icon: <FileText size={16} /> },
      { label: 'Video', href: '/dashboard/video-verification', icon: <Video size={16} /> },
      { label: 'QR Verification', href: '/dashboard/qr-verify', icon: <QrCode size={16} /> },
    ]
  },
  {
    label: 'Proofs', icon: <FileText size={16} />,
    children: [
      { label: 'All Proofs', href: '/dashboard/proofs', icon: <FileText size={16} /> },
      { label: 'Verified', href: '/dashboard/proofs?status=VERIFIED', icon: <Shield size={16} /> },
      { label: 'Pending', href: '/dashboard/proofs?status=REGISTERED', icon: <History size={16} /> },
    ]
  },
  { label: 'Activity', href: '/dashboard/activity', icon: <Activity size={16} /> },
  { label: 'Analytics', href: '/dashboard/analytics', icon: <BarChart3 size={16} /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings size={16} /> },
  { label: 'Admin', href: '/dashboard/admin', icon: <Users size={16} />, adminOnly: true },
]

function NavGroup({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const [open, setOpen] = useState(true)
  const { isAdmin } = useAuth()
  if (item.adminOnly && !isAdmin) return null

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="sidebar-link w-full flex justify-between"
          style={{ paddingLeft: `${(depth + 1) * 1}rem` }}
        >
          <span className="flex items-center gap-2.5">
            {item.icon}
            {item.label}
          </span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 pl-3 border-l" style={{ borderColor: '#1E293B' }}>
                {item.children.map(child => (
                  <NavGroup key={child.label} item={child} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <NavLink
      to={item.href!}
      end={item.href === '/dashboard'}
      className={({ isActive }) =>
        `sidebar-link flex items-center gap-2.5 ${isActive ? 'active' : ''}`
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  )
}

export function DashboardSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <aside
      className="hidden md:flex flex-col h-screen sticky top-0 w-60 flex-shrink-0"
      style={{ background: '#0B0F17', borderRight: '1px solid #1E293B' }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: '#1E293B' }}>
        <NavLink to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
            <Shield size={16} color="white" fill="white" />
          </div>
          <span className="font-bold text-base" style={{ color: '#F8FAFC' }}>ProofChain</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {NAV.map(item => <NavGroup key={item.label} item={item} />)}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t" style={{ borderColor: '#1E293B' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: '#fff' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{user?.username}</div>
              <div className="text-xs" style={{ color: '#475569' }}>{user?.role}</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-sm"
          style={{ color: '#EF4444' }}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  )
}

// Mobile sidebar (drawer)
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col md:hidden"
            style={{ background: '#0B0F17', borderRight: '1px solid #1E293B' }}
          >
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: '#1E293B' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)' }}>
                  <Shield size={16} color="white" fill="white" />
                </div>
                <span className="font-bold text-base" style={{ color: '#F8FAFC' }}>ProofChain</span>
              </div>
              <button onClick={onClose} style={{ color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
              {NAV.map(item => <NavGroup key={item.label} item={item} />)}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: '#1E293B' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', color: '#fff' }}>
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#F8FAFC' }}>{user?.username}</div>
                  <div className="text-xs" style={{ color: '#475569' }}>{user?.role}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="sidebar-link w-full text-sm" style={{ color: '#EF4444' }}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
