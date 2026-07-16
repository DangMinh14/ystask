import { http } from './http'

/** Kanban columns. */
export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected'

export interface JobApplicationDto {
  id: number
  company: string
  position: string
  status: JobStatus
  sortOrder: number
  salary: string | null
  location: string | null
  url: string | null
  note: string | null
  appliedDate: string | null
  interviewAt: string | null
}

export interface JobPayload {
  company: string
  position: string
  status: JobStatus
  salary: string | null
  location: string | null
  url: string | null
  note: string | null
  appliedDate: string | null
  interviewAt: string | null
}

export const jobsService = {
  list: () => http.get<JobApplicationDto[]>('/jobs'),
  create: (payload: JobPayload) => http.post<JobApplicationDto>('/jobs', payload),
  update: (id: number, payload: JobPayload) => http.put<JobApplicationDto>(`/jobs/${id}`, payload),
  remove: (id: number) => http.delete<void>(`/jobs/${id}`),
  move: (id: number, status: JobStatus, index: number) =>
    http.patch<JobApplicationDto>(`/jobs/${id}/move`, { status, index }),
}

export const JOB_STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'Applied', label: 'Applied' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Offer', label: 'Offer' },
  { value: 'Rejected', label: 'Rejected' },
]
