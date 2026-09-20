// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function truncateHash(hash: string, start = 8, end = 8): string {
  if (!hash || hash.length < start + end + 3) return hash
  return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export function getStatusColor(status: string): string {
  const s = status?.toUpperCase()
  if (['VERIFIED', 'AUTHENTIC', 'PASS'].includes(s)) return '#22C55E'
  if (['TAMPERED', 'FAILED', 'FAIL', 'REVOKED'].includes(s)) return '#EF4444'
  if (['PENDING', 'REGISTERED', 'UNCHECKED'].includes(s)) return '#F59E0B'
  return '#94A3B8'
}

export function getStatusBadgeClass(status: string): string {
  const s = status?.toUpperCase()
  if (['VERIFIED', 'AUTHENTIC', 'PASS', 'ACTIVE'].includes(s)) return 'badge-verified'
  if (['TAMPERED', 'FAILED', 'FAIL', 'REVOKED'].includes(s)) return 'badge-failed'
  if (['PENDING'].includes(s)) return 'badge-pending'
  return 'badge-registered'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}
