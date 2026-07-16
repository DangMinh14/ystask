import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { loadTokens, saveTokens, setSessionExpiredHandler } from '../services/http'
import { authService, type AuthResponse, type UserDto } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'Admin')

  function applyAuth(response: AuthResponse) {
    saveTokens({ accessToken: response.accessToken, refreshToken: response.refreshToken })
    user.value = response.user
  }

  async function register(payload: { email: string; displayName: string; password: string }) {
    applyAuth(await authService.register(payload))
  }

  async function login(payload: { email: string; password: string }) {
    applyAuth(await authService.login(payload))
  }

  async function logout() {
    const tokens = loadTokens()
    if (tokens?.refreshToken) {
      try {
        await authService.logout(tokens.refreshToken)
      } catch {
        /* revoking is best-effort */
      }
    }
    saveTokens(null)
    user.value = null
  }

  /** Restore the session on app boot from the persisted tokens. */
  async function initialize() {
    if (initialized.value) return
    setSessionExpiredHandler(() => {
      user.value = null
    })
    if (loadTokens()?.accessToken) {
      try {
        user.value = await authService.me()
      } catch {
        user.value = null
      }
    }
    initialized.value = true
  }

  return { user, initialized, isAuthenticated, isAdmin, register, login, logout, initialize }
})
