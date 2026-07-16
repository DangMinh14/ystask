<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Flame,
  Wallet,
  BriefcaseBusiness,
  ShieldCheck,
  Wrench,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  MonitorSmartphone,
} from 'lucide-vue-next'
import { useTheme } from '../../composables/useTheme'
import { useAuthStore } from '../../stores/auth'
import BrandMark from './BrandMark.vue'

const { preference, cycleTheme } = useTheme()
const auth = useAuthStore()
const router = useRouter()
const drawerOpen = ref(false)

const themeLabel = computed(
  () => ({ system: 'System', light: 'Light', dark: 'Dark' })[preference.value],
)
const themeIcon = computed(
  () => ({ system: MonitorSmartphone, light: Sun, dark: Moon })[preference.value],
)

const navItems = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/app/habits', label: 'Habits', icon: Flame },
  { to: '/app/expenses', label: 'Expenses', icon: Wallet },
  { to: '/app/jobs', label: 'Jobs', icon: BriefcaseBusiness },
]

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="flex min-h-dvh">
    <!-- Desktop sidebar -->
    <aside class="fixed inset-y-0 left-0 z-100 hidden w-64 flex-col border-r-2 border-line-strong bg-(--surface-card) lg:flex">
      <div class="flex h-16 items-center gap-2.5 border-b-2 border-line-strong px-5">
        <RouterLink to="/" class="flex items-center gap-2.5" aria-label="Ystask home">
          <BrandMark class="size-8" />
          <span class="text-lg font-bold tracking-tight text-ink">Ystask</span>
        </RouterLink>
      </div>

      <nav class="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="App navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link flex items-center gap-3 rounded-sm border-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-mid transition-colors hover:bg-accent-soft hover:text-ink"
          :class="{ 'exact-only': item.exact }"
        >
          <component :is="item.icon" class="size-5" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>

        <div class="my-3 border-t-2 border-line" role="separator" />

        <RouterLink
          to="/#tools"
          class="flex items-center gap-3 rounded-sm border-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-mid transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <Wrench class="size-5" aria-hidden="true" />
          Instant tools
        </RouterLink>

        <RouterLink
          v-if="auth.isAdmin"
          to="/app/admin"
          class="nav-link flex items-center gap-3 rounded-sm border-2 border-transparent px-3 py-2.5 text-sm font-medium text-ink-mid transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <ShieldCheck class="size-5" aria-hidden="true" />
          Admin
        </RouterLink>
      </nav>

      <div class="border-t-2 border-line-strong p-3">
        <div class="flex items-center gap-3 rounded-sm px-3 py-2">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong bg-accent text-sm font-bold text-on-accent">
            {{ auth.user?.displayName?.charAt(0)?.toUpperCase() ?? '?' }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-ink">{{ auth.user?.displayName }}</p>
            <p class="truncate text-xs text-ink-faint">{{ auth.user?.email }}</p>
          </div>
        </div>
        <div class="mt-1 flex items-center gap-1">
          <button
            type="button"
            class="press flex h-9 flex-1 items-center justify-center gap-2 rounded-sm text-sm font-medium text-ink-mid transition-colors hover:bg-accent-soft hover:text-ink"
            :aria-label="`Theme: ${themeLabel}. Click to change`"
            @click="cycleTheme"
          >
            <component :is="themeIcon" class="size-4" aria-hidden="true" />
            {{ themeLabel }}
          </button>
          <button
            type="button"
            class="press flex h-9 flex-1 items-center justify-center gap-2 rounded-sm text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
            @click="handleLogout"
          >
            <LogOut class="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile top bar -->
    <header class="fixed inset-x-0 top-0 z-100 flex h-16 items-center justify-between border-b-2 border-line-strong bg-(--surface-card) px-4 lg:hidden">
      <RouterLink to="/" class="flex items-center gap-2" aria-label="Ystask home">
        <BrandMark class="size-7" />
        <span class="font-bold tracking-tight text-ink">Ystask</span>
      </RouterLink>
      <button
        type="button"
        class="press flex size-10 items-center justify-center rounded-sm border-2 border-line-strong text-ink"
        aria-label="Open menu"
        @click="drawerOpen = true"
      >
        <Menu class="size-6" />
      </button>
    </header>

    <!-- Mobile drawer -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="drawerOpen" class="fixed inset-0 z-400 lg:hidden">
          <div class="absolute inset-0 bg-(--scrim)" @click="drawerOpen = false" />
          <div class="drawer-panel absolute inset-y-0 right-0 flex w-72 flex-col border-l-2 border-line-strong bg-(--surface-solid)">
            <div class="flex h-16 items-center justify-between border-b-2 border-line-strong px-4">
              <span class="font-bold text-ink">Menu</span>
              <button type="button" class="press flex size-10 items-center justify-center rounded-sm border-2 border-line-strong text-ink" aria-label="Close menu" @click="drawerOpen = false">
                <X class="size-5" />
              </button>
            </div>
            <nav class="flex flex-1 flex-col gap-1 px-3 pt-3" aria-label="App navigation">
              <RouterLink
                v-for="item in [...navItems, ...(auth.isAdmin ? [{ to: '/app/admin', label: 'Admin', icon: ShieldCheck }] : [])]"
                :key="item.to"
                :to="item.to"
                class="nav-link flex items-center gap-3 rounded-sm border-2 border-transparent px-3 py-3 text-sm font-medium text-ink-mid hover:bg-accent-soft hover:text-ink"
                @click="drawerOpen = false"
              >
                <component :is="item.icon" class="size-5" aria-hidden="true" />
                {{ item.label }}
              </RouterLink>
            </nav>
            <div class="flex items-center gap-1 border-t-2 border-line-strong p-3">
              <button type="button" class="press flex h-10 flex-1 items-center justify-center gap-2 rounded-sm text-sm font-medium text-ink-mid hover:bg-accent-soft" @click="cycleTheme">
                <component :is="themeIcon" class="size-4" aria-hidden="true" />
                {{ themeLabel }}
              </button>
              <button type="button" class="press flex h-10 flex-1 items-center justify-center gap-2 rounded-sm text-sm font-medium text-danger hover:bg-danger-soft" @click="handleLogout">
                <LogOut class="size-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Main content -->
    <main class="min-w-0 flex-1 pt-16 lg:ml-64 lg:pt-0">
      <div class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Active nav highlighting driven by vue-router classes */
.nav-link.router-link-active:not(.exact-only),
.nav-link.router-link-exact-active {
  background: var(--accent-soft);
  border-color: var(--border-strong);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 2px 2px 0 0 var(--border-strong);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity var(--motion-base) var(--ease-standard);
}
.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform var(--motion-base) var(--ease-standard);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
/* Never intercept clicks while the closing animation plays. */
.drawer-leave-active {
  pointer-events: none;
}
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>
