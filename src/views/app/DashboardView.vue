<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Flame,
  Wallet,
  BriefcaseBusiness,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  Trophy,
} from 'lucide-vue-next'
import UiCard from '../../components/ui/UiCard.vue'
import UiStat from '../../components/ui/UiStat.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import HabitHeatmap from '../../features/habits/HabitHeatmap.vue'
import TrendLineChart from '../../features/expenses/TrendLineChart.vue'
import { dashboardService, type DashboardSummary } from '../../services/dashboardService'
import { ApiError } from '../../services/http'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import { formatVND } from '../../utils/money'

const auth = useAuthStore()
const toast = useToastStore()

const summary = ref<DashboardSummary | null>(null)
const loading = ref(true)

const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const openJobs = computed(() =>
  summary.value ? summary.value.jobs.applied + summary.value.jobs.interview : 0,
)

function formatInterview(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  try {
    summary.value = await dashboardService.summary()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not load your overview.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <p class="text-eyebrow">{{ todayLabel }}</p>
      <h1 class="mt-1 text-2xl font-bold text-ink">
        Hey {{ auth.user?.displayName?.split(' ').at(-1) ?? 'there' }}
      </h1>
      <p class="mt-1 text-sm text-ink-mid">Here is how your day is shaping up.</p>
    </header>

    <div v-if="loading" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="surface h-24 animate-pulse" />
    </div>

    <template v-else-if="summary">
      <!-- Stat row -->
      <div class="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UiStat
          label="Habits today"
          :value="`${summary.habits.checkedInToday}/${summary.habits.totalHabits}`"
          :icon="CheckCircle2"
        />
        <UiStat
          label="Best streak"
          :count="summary.habits.bestCurrentStreak"
          :formatter="(n) => `${n} ${n === 1 ? 'day' : 'days'}`"
          :icon="Trophy"
        />
        <UiStat
          label="Spent this month"
          :count="summary.expenses.totalExpense"
          :formatter="formatVND"
          :sub="summary.expenses.budget.limit ? `${summary.expenses.budget.percent}% of budget` : 'No budget set'"
          :icon="Wallet"
          :tone="summary.expenses.budget.isOver ? 'danger' : summary.expenses.budget.isNear ? 'warning' : 'accent'"
        />
        <UiStat label="Open applications" :count="openJobs" :icon="BriefcaseBusiness" />
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <!-- Habits -->
        <UiCard class="lg:col-span-2">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-bold text-ink">Habit rhythm</h2>
            <RouterLink to="/app/habits" class="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
              Details
              <ArrowRight class="size-4" aria-hidden="true" />
            </RouterLink>
          </div>
          <div class="mt-4">
            <HabitHeatmap :days="summary.habits.heatmap" :weeks="26" />
          </div>
        </UiCard>

        <!-- Upcoming interviews -->
        <UiCard>
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-bold text-ink">Interviews</h2>
            <RouterLink to="/app/jobs" class="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
              Board
              <ArrowRight class="size-4" aria-hidden="true" />
            </RouterLink>
          </div>
          <ul v-if="summary.jobs.upcomingInterviews.length" class="mt-4 flex flex-col gap-3">
            <li
              v-for="interview in summary.jobs.upcomingInterviews"
              :key="interview.id"
              class="flex items-start gap-3 rounded-sm border-2 border-line-strong p-3"
            >
              <div class="flex size-9 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong bg-warning-soft text-warning">
                <CalendarClock class="size-4" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-ink">{{ interview.position }}</p>
                <p class="truncate text-xs text-ink-mid">{{ interview.company }}</p>
                <p class="mt-0.5 text-xs font-semibold text-warning">{{ formatInterview(interview.interviewAt) }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="mt-4 text-sm text-ink-faint">No upcoming interviews.</p>

          <div class="mt-4 flex flex-wrap gap-2 border-t-2 border-line pt-4">
            <UiBadge kind="info">Applied {{ summary.jobs.applied }}</UiBadge>
            <UiBadge kind="warning">Interview {{ summary.jobs.interview }}</UiBadge>
            <UiBadge kind="success">Offer {{ summary.jobs.offer }}</UiBadge>
            <UiBadge kind="danger">Rejected {{ summary.jobs.rejected }}</UiBadge>
          </div>
        </UiCard>
      </div>

      <!-- Finance -->
      <UiCard>
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold text-ink">Cash flow, last 6 months</h2>
          <RouterLink to="/app/expenses" class="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
            Details
            <ArrowRight class="size-4" aria-hidden="true" />
          </RouterLink>
        </div>
        <div class="mt-4">
          <TrendLineChart :trend="summary.expenses.trend" />
        </div>
      </UiCard>

      <!-- Quick nav -->
      <div class="stagger grid gap-3 sm:grid-cols-3">
        <RouterLink to="/app/habits" class="surface hover-lift flex items-center gap-3 p-4">
          <Flame class="size-5 text-accent-strong" aria-hidden="true" />
          <span class="text-sm font-semibold text-ink">Check in a habit</span>
          <ArrowRight class="ml-auto size-4 text-ink-faint" aria-hidden="true" />
        </RouterLink>
        <RouterLink to="/app/expenses" class="surface hover-lift flex items-center gap-3 p-4">
          <Wallet class="size-5 text-accent-strong" aria-hidden="true" />
          <span class="text-sm font-semibold text-ink">Log a transaction</span>
          <ArrowRight class="ml-auto size-4 text-ink-faint" aria-hidden="true" />
        </RouterLink>
        <RouterLink to="/app/jobs" class="surface hover-lift flex items-center gap-3 p-4">
          <BriefcaseBusiness class="size-5 text-accent-strong" aria-hidden="true" />
          <span class="text-sm font-semibold text-ink">Update an application</span>
          <ArrowRight class="ml-auto size-4 text-ink-faint" aria-hidden="true" />
        </RouterLink>
      </div>
    </template>
  </div>
</template>
