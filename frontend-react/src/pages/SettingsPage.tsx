// src/pages/SettingsPage.tsx
import { useState } from 'react'
import { User, Bell, Shield, Key, HardDrive, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const TABS = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'video', label: 'Video Verification', icon: <HardDrive size={16} /> },
  ]

  return (
    <div className="space-y-6 page-enter max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-[#F8FAFC]">Settings</h1>
        <p className="text-sm mt-1 text-[#94A3B8]">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${activeTab === tab.id ? 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/30' : 'bg-transparent text-[#94A3B8] border-transparent hover:bg-[#1E293B]/50'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </aside>

        <div className="flex-1 bg-[#101722] rounded-2xl border border-[#1E293B] p-6 md:p-8">
          {saved && (
            <div className="mb-6 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
              <Shield size={16} /> Settings saved successfully.
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1">Profile Information</h3>
                <p className="text-xs text-[#94A3B8] mb-6">Update your account profile details.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Username</label>
                  <input type="text" className="input-field bg-[#05070B]" defaultValue={user?.username} disabled />
                  <p className="text-[10px] text-[#475569] mt-1">Username cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Role</label>
                  <input type="text" className="input-field bg-[#05070B]" defaultValue={user?.role} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Email Address</label>
                  <input type="email" className="input-field" defaultValue={`${user?.username}@proofchain.internal`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Organization</label>
                  <input type="text" className="input-field" defaultValue="ProofChain Corp" />
                </div>
              </div>
              <div className="pt-4 border-t border-[#1E293B]">
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1">Password & Security</h3>
                <p className="text-xs text-[#94A3B8] mb-6">Update your password and secure your account.</p>
              </div>
              <div className="max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Current Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Confirm New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Key size={20} className="text-blue-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-blue-400 mb-1">Two-Factor Authentication</h4>
                    <p className="text-sm text-[#94A3B8] mb-3">Add an extra layer of security to your account.</p>
                    <button type="button" className="text-sm px-4 py-2 rounded bg-blue-500 text-white font-semibold">Enable 2FA</button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E293B]">
                <button type="submit" className="btn-primary">Update Password</button>
              </div>
            </form>
          )}

          {activeTab === 'video' && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1">Video Verification Settings</h3>
                <p className="text-xs text-[#94A3B8] mb-6">Configure how video verifications are processed and stored.</p>
              </div>
              
              <div className="space-y-6 max-w-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[#F8FAFC]">Require Audio Checks</h4>
                    <p className="text-xs text-[#94A3B8]">Transcribe audio to verify challenge response.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#7C3AED]" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-[#F8FAFC]">Require Face Presence</h4>
                    <p className="text-xs text-[#94A3B8]">Ensure a human face is visible in the frame.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#7C3AED]" />
                </div>
                
                <div className="pt-4 border-t border-[#1E293B]">
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Default Maximum Video Length (seconds)</label>
                  <select className="input-field max-w-[200px]">
                    <option value="15">15 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">60 seconds</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#94A3B8]">Video Retention Policy</label>
                  <select className="input-field max-w-[200px]">
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year</option>
                    <option value="indefinite">Indefinite (Blockchain anchored)</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-6 border-t border-[#1E293B]">
                <button type="submit" className="btn-primary">Save Settings</button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mb-1">Notifications</h3>
                <p className="text-xs text-[#94A3B8] mb-6">Manage how ProofChain alerts you.</p>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm flex gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                Notification delivery requires SMTP configuration on the backend. Please contact your system administrator to enable these settings.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
