import { http } from './http'
import { todayISO } from '../utils/date'
import type { HabitsOverview } from './habitsService'
import type { MonthlySummary } from './expensesService'

export interface UpcomingInterview {
  id: number
  company: string
  position: string
  interviewAt: string
}

export interface JobsSummary {
  total: number
  applied: number
  interview: number
  offer: number
  rejected: number
  upcomingInterviews: UpcomingInterview[]
}

export interface DashboardSummary {
  habits: HabitsOverview
  expenses: MonthlySummary
  jobs: JobsSummary
}

export const dashboardService = {
  summary: () => http.get<DashboardSummary>(`/dashboard/summary?today=${todayISO()}`),
}
