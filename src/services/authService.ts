import { http } from './http'

export interface UserDto {
  id: number
  email: string
  displayName: string
  role: string
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  user: UserDto
}

export const authService = {
  register: (payload: { email: string; displayName: string; password: string }) =>
    http.post<AuthResponse>('/auth/register', payload),

  login: (payload: { email: string; password: string }) =>
    http.post<AuthResponse>('/auth/login', payload),

  logout: (refreshToken: string) => http.post<void>('/auth/logout', { refreshToken }),

  me: () => http.get<UserDto>('/auth/me'),
}
