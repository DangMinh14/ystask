<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, Flame, Wallet, BriefcaseBusiness, Zap } from 'lucide-vue-next'
import { tools } from '../features/tools/registry'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const trackers = [
  {
    icon: Flame,
    name: 'Habits and goals',
    description: 'Check in daily, keep your streak alive and watch progress fill a GitHub-style heatmap.',
    rotate: '-1.5deg',
  },
  {
    icon: Wallet,
    name: 'Expenses',
    description: 'Log income and spending by category, set a monthly budget and get warned before you blow it.',
    rotate: '1deg',
  },
  {
    icon: BriefcaseBusiness,
    name: 'Job applications',
    description: 'Track every application on a drag-and-drop Kanban board with notes and interview reminders.',
    rotate: '-1deg',
  },
]

const TICKER = [
  'count characters',
  'spin the wheel',
  'generate passwords',
  'make QR codes',
  'convert units',
  'format JSON',
  'focus with pomodoro',
  'build email signatures',
  'check your BMI',
  'test typing speed',
  'convert currencies',
  'count the days',
  'clean up line breaks',
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b-2 border-line-strong">
      <div class="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20 lg:pb-24">
        <p class="sticker inline-flex rotate-[-2deg] items-center gap-2 rounded-sm border-2 border-line-strong bg-(--color-blue-soft) px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-info shadow-button">
          <Zap class="size-3.5" aria-hidden="true" />
          Personal productivity kit
        </p>
        <h1 class="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Own your day,
          <span class="relative inline-block px-2 text-on-accent">
            <span class="absolute inset-0 rotate-[-1deg] rounded-sm border-2 border-line-strong bg-accent shadow-button" aria-hidden="true" />
            <span class="relative">one task</span>
          </span>
          at a time.
        </h1>
        <p class="mt-6 max-w-xl text-base text-ink-mid sm:text-lg">
          Instant tools that work without an account, plus trackers for habits,
          money and job applications. All in one place.
        </p>
        <div class="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <a
            v-magnetic
            href="#tools"
            class="press press-shadow inline-flex h-12 items-center gap-2 rounded-sm border-2 border-line-strong bg-accent px-7 text-base font-semibold text-on-accent shadow-button transition-colors hover:bg-accent-strong"
          >
            Try the tools
            <ArrowRight class="size-4" aria-hidden="true" />
          </a>
          <RouterLink
            v-magnetic
            :to="auth.isAuthenticated ? '/app' : '/auth/register'"
            class="press press-shadow inline-flex h-12 items-center rounded-sm border-2 border-line-strong bg-solid px-7 text-base font-semibold text-ink shadow-button transition-colors hover:bg-accent-soft"
          >
            {{ auth.isAuthenticated ? 'Open dashboard' : 'Create a free account' }}
          </RouterLink>
        </div>
      </div>

      <!-- Ticker strip -->
      <div class="marquee border-t-2 border-line-strong bg-(--surface-card) py-2.5" aria-hidden="true">
        <div class="marquee-track">
          <span
            v-for="(item, i) in [...TICKER, ...TICKER]"
            :key="i"
            class="mx-4 inline-flex items-center gap-4 font-mono text-xs font-semibold uppercase tracking-widest text-ink-mid"
          >
            {{ item }}
            <span class="text-accent-strong">★</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Instant tools -->
    <section id="tools" class="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6 lg:py-20">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="text-eyebrow">Instant tools</p>
          <h2 class="mt-2 text-2xl font-bold text-ink sm:text-3xl">No sign-in needed</h2>
        </div>
      </div>
      <div class="stagger mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="tool in tools"
          :key="tool.id"
          v-tilt
          :to="`/tools/${tool.id}`"
          class="surface group flex flex-col gap-3 p-5"
        >
          <div data-tilt-layer class="flex size-11 items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong transition-colors group-hover:bg-accent group-hover:text-on-accent">
            <component :is="tool.icon" class="size-5" aria-hidden="true" />
          </div>
          <h3 class="text-base font-bold text-ink">{{ tool.name }}</h3>
          <p class="text-sm leading-relaxed text-ink-mid">{{ tool.description }}</p>
          <span class="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
            Open tool
            <ArrowRight class="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </RouterLink>
      </div>
    </section>

    <!-- Trackers -->
    <section class="border-t-2 border-line-strong bg-(--surface-card)">
      <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div class="max-w-2xl">
          <p class="text-eyebrow">Personal trackers</p>
          <h2 class="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Keep score of what matters
          </h2>
          <p class="mt-3 text-ink-mid">
            Sign in to save your data and see it all on one dashboard.
          </p>
        </div>
        <div class="stagger mt-10 grid gap-5 lg:grid-cols-3">
          <div
            v-for="tracker in trackers"
            :key="tracker.name"
            class="sticker surface flex flex-col gap-3 bg-(--surface-solid) p-6"
            :style="{ transform: `rotate(${tracker.rotate})` }"
          >
            <div class="flex size-11 items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong">
              <component :is="tracker.icon" class="size-5" aria-hidden="true" />
            </div>
            <h3 class="text-lg font-bold text-ink">{{ tracker.name }}</h3>
            <p class="text-sm leading-relaxed text-ink-mid">{{ tracker.description }}</p>
          </div>
        </div>
        <div class="mt-10">
          <RouterLink
            :to="auth.isAuthenticated ? '/app' : '/auth/register'"
            class="press press-shadow inline-flex h-12 items-center gap-2 rounded-sm border-2 border-line-strong bg-accent px-7 text-base font-semibold text-on-accent shadow-button transition-colors hover:bg-accent-strong"
          >
            {{ auth.isAuthenticated ? 'Open dashboard' : 'Start for free' }}
            <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
