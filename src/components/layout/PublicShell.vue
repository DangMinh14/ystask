<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { Moon, Sun, MonitorSmartphone, LayoutDashboard, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'
import { useAuthStore } from '../../stores/auth'
import BrandMark from './BrandMark.vue'
import ToolsSidebar from './ToolsSidebar.vue'

const { preference, cycleTheme } = useTheme()
const auth = useAuthStore()
const route = useRoute()

const themeIcon = computed(
  () => ({ system: MonitorSmartphone, light: Sun, dark: Moon })[preference.value],
)

const SIDEBAR_KEY = 'ystask-sidebar'

function loadSidebarOpen(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== 'closed'
  } catch {
    return true
  }
}

/** Desktop: persisted open/closed column. Mobile: transient overlay drawer. */
const sidebarOpen = ref(loadSidebarOpen())
const drawerOpen = ref(false)

function toggleSidebar() {
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches
  if (isDesktop) {
    sidebarOpen.value = !sidebarOpen.value
    try {
      localStorage.setItem(SIDEBAR_KEY, sidebarOpen.value ? 'open' : 'closed')
    } catch {
      /* storage may be unavailable */
    }
  } else {
    drawerOpen.value = !drawerOpen.value
  }
}

// The drawer never survives a navigation.
watch(() => route.fullPath, () => (drawerOpen.value = false))
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <header class="sticky top-0 z-100 border-b-2 border-line-strong bg-(--background-primary)">
      <div class="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            class="press flex size-10 items-center justify-center rounded-sm border-2 border-line-strong text-ink transition-colors hover:bg-accent-soft"
            :aria-label="sidebarOpen ? 'Hide the tools sidebar' : 'Show the tools sidebar'"
            :aria-expanded="sidebarOpen"
            @click="toggleSidebar"
          >
            <PanelLeftClose v-if="sidebarOpen" class="hidden size-5 lg:block" />
            <PanelLeftOpen v-else class="hidden size-5 lg:block" />
            <PanelLeftOpen class="size-5 lg:hidden" />
          </button>
          <RouterLink to="/" class="flex items-center gap-2.5" aria-label="Ystask home">
            <BrandMark class="size-8" />
            <span class="text-lg font-bold tracking-tight text-ink">Ystask</span>
          </RouterLink>
        </div>

        <nav class="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          <RouterLink
            to="/#tools"
            class="hidden rounded-sm px-4 py-2 text-sm font-medium text-ink-mid transition-colors hover:bg-accent-soft hover:text-ink sm:block"
          >
            Tools
          </RouterLink>
          <button
            type="button"
            class="press flex size-10 items-center justify-center rounded-sm border-2 border-line-strong text-ink transition-colors hover:bg-accent-soft"
            :aria-label="`Theme: ${preference}. Click to change`"
            @click="cycleTheme"
          >
            <component :is="themeIcon" class="size-5" />
          </button>

          <RouterLink
            v-if="auth.isAuthenticated"
            to="/app"
            class="press press-shadow ml-1 inline-flex h-10 items-center gap-2 rounded-sm border-2 border-line-strong bg-accent px-4 text-sm font-semibold text-on-accent shadow-button transition-colors hover:bg-accent-strong"
          >
            <LayoutDashboard class="size-4" aria-hidden="true" />
            <span class="hidden sm:inline">Dashboard</span>
            <span class="sm:hidden">App</span>
          </RouterLink>
          <template v-else>
            <RouterLink
              to="/auth/login"
              class="rounded-sm px-4 py-2 text-sm font-medium text-ink-mid transition-colors hover:bg-accent-soft hover:text-ink"
            >
              Sign in
            </RouterLink>
            <RouterLink
              to="/auth/register"
              class="press press-shadow inline-flex h-10 items-center rounded-sm border-2 border-line-strong bg-accent px-4 text-sm font-semibold text-on-accent shadow-button transition-colors hover:bg-accent-strong"
            >
              Sign up
            </RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <div class="flex flex-1">
      <!-- Desktop sidebar column -->
      <aside
        class="sticky top-16 hidden h-[calc(100dvh-4rem)] shrink-0 overflow-hidden border-r-2 border-line-strong bg-(--surface-card) transition-[width] duration-300 motion-reduce:transition-none lg:block"
        :class="sidebarOpen ? 'w-64' : 'w-0 border-r-0'"
        aria-label="Tools sidebar"
      >
        <div class="h-full w-64">
          <ToolsSidebar />
        </div>
      </aside>

      <!-- Mobile drawer -->
      <Teleport to="body">
        <Transition name="drawer-left">
          <div v-if="drawerOpen" class="fixed inset-0 z-200 lg:hidden">
            <div class="absolute inset-0 bg-(--scrim)" aria-hidden="true" @click="drawerOpen = false" />
            <div
              class="drawer-panel absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r-2 border-line-strong bg-(--surface-solid) shadow-pop"
              role="dialog"
              aria-modal="true"
              aria-label="Tools sidebar"
            >
              <ToolsSidebar @navigate="drawerOpen = false" />
            </div>
          </div>
        </Transition>
      </Teleport>

      <div class="flex min-w-0 flex-1 flex-col">
        <main class="flex-1">
          <RouterView />
        </main>

        <footer class="border-t-2 border-line-strong py-8">
          <div class="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-ink-faint sm:flex-row sm:px-6">
            <p>© {{ new Date().getFullYear() }} Ystask, part of ystasearea.space</p>
            <p class="font-mono text-xs tracking-wide">small tools, steady progress</p>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawer-left-enter-active,
.drawer-left-leave-active {
  transition: opacity var(--motion-base) var(--ease-standard);
}
.drawer-left-enter-active .drawer-panel,
.drawer-left-leave-active .drawer-panel {
  transition: transform var(--motion-base) var(--ease-snap);
}
.drawer-left-enter-from,
.drawer-left-leave-to {
  opacity: 0;
}
/* Never intercept clicks while the closing animation plays. */
.drawer-left-leave-active {
  pointer-events: none;
}
.drawer-left-enter-from .drawer-panel,
.drawer-left-leave-to .drawer-panel {
  transform: translateX(-100%);
}
@media (prefers-reduced-motion: reduce) {
  .drawer-left-enter-active,
  .drawer-left-leave-active,
  .drawer-left-enter-active .drawer-panel,
  .drawer-left-leave-active .drawer-panel {
    transition: none;
  }
}
</style>
