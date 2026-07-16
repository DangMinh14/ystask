import { ref } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'ystask-theme'

function loadPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

const preference = ref<ThemePreference>(loadPreference())

function resolve(pref: ThemePreference): 'light' | 'dark' {
  if (pref !== 'system') return pref
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Three-state theme preference persisted to localStorage.
 * "system" follows the OS setting live (the boot script in index.html
 * installs the matchMedia listener that keeps data-theme in sync).
 */
export function useTheme() {
  function setPreference(pref: ThemePreference) {
    preference.value = pref
    document.documentElement.setAttribute('data-theme', resolve(pref))
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }

  /** Cycles system, light, dark. */
  function cycleTheme() {
    const order: ThemePreference[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(preference.value) + 1) % order.length]!
    setPreference(next)
  }

  return { preference, setPreference, cycleTheme }
}
