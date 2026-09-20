// src/services/api.ts
// Base API client — wraps fetch with credentials for Flask session auth

const BASE = ''  // Vite proxies /api → Flask :5000

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
  }

  return data as T
}

// ============================================================
// AUTH SERVICE
// ============================================================
export const authService = {
  async login(username: string, password: string) {
    return request<{ message: string; user: { username: string; role: string } }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }
    )
  },

  async logout() {
    return request<{ message: string }>('/api/auth/logout', { method: 'POST' })
  },

  async getMe() {
    return request<{ user: { username: string; role: string } }>('/api/auth/me')
  },
}

// ============================================================
// DASHBOARD SERVICE
// ============================================================
export interface DashboardStats {
  total_evidence: number
  verified_evidence: number
  tampering_detected: number
  pending_evidence: number
  recent_evidence: EvidenceRecord[]
  recent_verifications: VerificationRecord[]
  video_verifications: {
    total: number
    verified: number
    pending: number
    failed: number
    recent: VideoVerification[]
  }
  blockchain: {
    connected: boolean
    rpc_url: string
    contract_address: string
    block_number: number
  }
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/api/dashboard/stats')
  },

  async getAlerts() {
    return request<Alert[]>('/api/alerts')
  },

  async seedDemo() {
    return request<{ message: string }>('/api/demo/seed', { method: 'POST' })
  },
}

// ============================================================
// EVIDENCE SERVICE
// ============================================================
export interface EvidenceRecord {
  evidence_id: string
  case_id: string
  title: string
  evidence_type: string
  original_filename: string
  file_hash: string
  collector: string
  location: string
  status: string
  tx_hash: string
  block_number: number
  created_at: string
}

export interface VerificationRecord {
  evidence_id: string
  status: string
  result_message: string
  verified_by: string
  original_hash: string
  current_hash: string
  created_at: string
}

export interface Alert {
  evidence_id: string
  original_hash: string
  computed_hash: string
  attempted_by: string
  notes: string
  created_at: string
}

export const evidenceService = {
  async getList(params?: { search?: string; type?: string; status?: string }): Promise<EvidenceRecord[]> {
    const qs = new URLSearchParams({
      search: params?.search || '',
      type: params?.type || '',
      status: params?.status || '',
    })
    return request<EvidenceRecord[]>(`/api/evidence?${qs}`)
  },

  async getById(id: string) {
    return request<{
      evidence: EvidenceRecord
      custody: CustodyEvent[]
      blockchain: Record<string, unknown>
    }>(`/api/evidence/${id}`)
  },

  async register(formData: FormData) {
    return request<{ evidence: EvidenceRecord; blockchain: Record<string, unknown> }>(
      '/api/evidence/register',
      { method: 'POST', body: formData }
    )
  },

  async verify(formData: FormData) {
    return request<{
      status: string
      result_message: string
      evidence_id: string
      original_hash: string
      current_hash: string
      verified_by: string
    }>('/api/evidence/verify', { method: 'POST', body: formData })
  },

  async addCustodyEvent(evidenceId: string, data: {
    action: string; person: string; role: string; notes: string
  }) {
    return request<{ message: string }>(
      `/api/evidence/${evidenceId}/custody`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    )
  },

  async getVideoVerifications(evidenceId: string): Promise<VideoVerification[]> {
    return request<VideoVerification[]>(`/api/evidence/${evidenceId}/video-verifications`)
  },
}

export interface CustodyEvent {
  action: string
  person: string
  role: string
  notes: string
  timestamp: number
  tx_hash: string
}

// ============================================================
// VIDEO VERIFICATION SERVICE
// ============================================================
export interface VideoVerification {
  id: number
  verification_id: string
  evidence_id: string
  user_id: string
  video_hash: string
  original_video_filename: string
  video_size: number
  duration: number
  format: string
  challenge_text: string
  challenge_response: string
  challenge_result: string
  face_check_result: string
  audio_check_result: string
  integrity_result: string
  overall_status: string
  access_status: string
  created_at: string
}

export interface VideoUploadResult {
  message: string
  verification: VideoVerification
  checks: { name: string; status: string; detail: string }[]
  evidence: { evidence_id: string; title: string; status: string; file_hash: string }
}

export const videoVerificationService = {
  async getChallenges(): Promise<string[]> {
    const data = await request<{ challenges: string[] }>('/api/video-verification/challenges')
    return data.challenges
  },

  async upload(formData: FormData): Promise<VideoUploadResult> {
    return request<VideoUploadResult>(
      '/api/video-verification/upload',
      { method: 'POST', body: formData }
    )
  },

  async getHistory(limit = 50): Promise<VideoVerification[]> {
    return request<VideoVerification[]>(`/api/video-verification/history?limit=${limit}`)
  },

  async getById(id: string): Promise<VideoVerification> {
    return request<VideoVerification>(`/api/video-verification/${id}`)
  },

  async getStats() {
    return request<{ total: number; verified: number; pending: number; failed: number; recent: VideoVerification[] }>(
      '/api/video-verification/stats'
    )
  },

  async delete(id: string) {
    return request<{ message: string }>(`/api/video-verification/${id}`, { method: 'DELETE' })
  },
}
