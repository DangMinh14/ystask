import { http } from './http'
import { todayISO } from '../utils/date'

export interface HabitDto {
  id: number
  name: string
  description: string | null
  color: string
  icon: string
  targetPerWeek: number
  isArchived: boolean
  currentStreak: number
  longestStreak: number
  totalCheckIns: number
  checkedInToday: boolean
  last7Days: string[]
}

export interface HeatmapDay {
  date: string
  count: number
}

export interface WeeklyCount {
  weekStart: string
  count: number
}

export interface HabitsOverview {
  totalHabits: number
  checkedInToday: number
  bestCurrentStreak: number
  heatmap: HeatmapDay[]
  weeklyCounts: WeeklyCount[]
}

export interface HabitPayload {
  name: string
  description: string | null
  color: string
  icon: string
  targetPerWeek: number
  isArchived?: boolean
}

// Always send the client's local date so streaks respect the user's timezone.
const t = () => `today=${todayISO()}`

export const habitsService = {
  list: () => http.get<HabitDto[]>(`/habits?${t()}`),
  overview: () => http.get<HabitsOverview>(`/habits/overview?${t()}`),
  create: (payload: HabitPayload) => http.post<HabitDto>(`/habits?${t()}`, payload),
  update: (id: number, payload: HabitPayload & { isArchived: boolean }) =>
    http.put<HabitDto>(`/habits/${id}?${t()}`, payload),
  remove: (id: number) => http.delete<void>(`/habits/${id}`),
  checkIn: (id: number, date: string) =>
    http.post<HabitDto>(`/habits/${id}/checkins?${t()}`, { date }),
  removeCheckIn: (id: number, date: string) =>
    http.delete<HabitDto>(`/habits/${id}/checkins/${date}?${t()}`),
}
