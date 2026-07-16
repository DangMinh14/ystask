import { http } from './http'

export interface AdminUser {
  id: number
  email: string
  displayName: string
  role: string
  createdAt: string
  isLocked: boolean
  habitCount: number
  transactionCount: number
  jobCount: number
}

export interface SystemStats {
  totalUsers: number
  lockedUsers: number
  newUsersLast7Days: number
  totalHabits: number
  totalCheckIns: number
  totalTransactions: number
  totalJobs: number
}

export const adminService = {
  users: (search?: string) =>
    http.get<AdminUser[]>(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  lock: (id: number) => http.post<void>(`/admin/users/${id}/lock`),
  unlock: (id: number) => http.post<void>(`/admin/users/${id}/unlock`),
  stats: () => http.get<SystemStats>('/admin/stats'),
}
