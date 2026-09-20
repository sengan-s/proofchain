// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DashboardLayout } from './components/DashboardLayout'

// Public
import { LandingPage } from './pages/LandingPage'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { SecurityPage } from './pages/SecurityPage'
import { PublicVerify } from './pages/PublicVerify'

// Auth
import { Dashboard } from './pages/Dashboard'
import { ProofList } from './pages/ProofList'
import { ProofDetail } from './pages/ProofDetail'
import { DocumentVerification } from './pages/DocumentVerification'
import { VideoVerificationPage } from './pages/VideoVerificationPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ActivityPage } from './pages/ActivityPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminPage } from './pages/AdminPage'
import { QrVerify } from './pages/QrVerify'

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#05070B]">
      <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/verify/:proofId" element={<PublicVerify />} />
          <Route path="/verify" element={<PublicVerify />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="proofs" element={<ProofList />} />
            <Route path="proofs/:id" element={<ProofDetail />} />
            <Route path="verification" element={<DocumentVerification />} />
            <Route path="video-verification" element={<VideoVerificationPage />} />
            <Route path="qr-verify" element={<QrVerify />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
