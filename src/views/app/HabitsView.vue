<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, Flame, CheckCircle2, Trophy, Check, Pencil, Trash2 } from 'lucide-vue-next'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiStat from '../../components/ui/UiStat.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import HabitFormModal from '../../features/habits/HabitFormModal.vue'
import HabitHeatmap from '../../features/habits/HabitHeatmap.vue'
import WeeklyBarChart from '../../features/habits/WeeklyBarChart.vue'
import { habitIcon } from '../../features/habits/habitIcons'
import {
  habitsService,
  type HabitDto,
  type HabitPayload,
  type HabitsOverview,
} from '../../services/habitsService'
import { useToastStore } from '../../stores/toast'
import { ApiError } from '../../services/http'
import { addDays, todayISO } from '../../utils/date'

const toast = useToastStore()

const habits = ref<HabitDto[]>([])
const overview = ref<HabitsOverview | null>(null)
const loading = ref(true)
const saving = ref(false)

const formOpen = ref(false)
const editing = ref<HabitDto | null>(null)
const deleting = ref<HabitDto | null>(null)

const activeHabits = computed(() => habits.value.filter((h) => !h.isArchived))
const archivedHabits = computed(() => habits.value.filter((h) => h.isArchived))

// Last 7 days ending today for the week dots.
const week = computed(() => Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i - 6)))
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = (new Date(y!, m! - 1, d!).getDay() + 6) % 7
  return DAY_LABELS[dow]!
}

async function loadAll() {
  try {
    const [list, ov] = await Promise.all([habitsService.list(), habitsService.overview()])
    habits.value = list
    overview.value = ov
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not load your habits.')
  } finally {
    loading.value = false
  }
}

async function refreshOverview() {
  try {
    overview.value = await habitsService.overview()
  } catch {
    /* keep the stale overview */
  }
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(habit: HabitDto) {
  editing.value = habit
  formOpen.value = true
}

async function save(payload: HabitPayload & { isArchived: boolean }) {
  saving.value = true
  try {
    if (editing.value) {
      const updated = await habitsService.update(editing.value.id, payload)
      habits.value = habits.value.map((h) => (h.id === updated.id ? updated : h))
      toast.success('Habit updated.')
    } else {
      habits.value.push(await habitsService.create(payload))
      toast.success('Habit created.')
    }
    formOpen.value = false
    refreshOverview()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not save the habit.')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await habitsService.remove(deleting.value.id)
    habits.value = habits.value.filter((h) => h.id !== deleting.value!.id)
    toast.success('Habit deleted.')
    deleting.value = null
    refreshOverview()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not delete the habit.')
  } finally {
    saving.value = false
  }
}

async function toggleDay(habit: HabitDto, date: string) {
  if (date > todayISO()) return
  const done = habit.last7Days.includes(date)
  try {
    const updated = done
      ? await habitsService.removeCheckIn(habit.id, date)
      : await habitsService.checkIn(habit.id, date)
    habits.value = habits.value.map((h) => (h.id === updated.id ? updated : h))
    refreshOverview()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not update the check-in.')
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-ink">Habits</h1>
        <p class="mt-1 text-sm text-ink-mid">Check in every day to keep your streak alive.</p>
      </div>
      <UiButton @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        Add habit
      </UiButton>
    </header>

    <!-- Stats -->
    <div v-if="overview" class="stagger grid gap-3 sm:grid-cols-3">
      <UiStat label="Active habits" :count="overview.totalHabits" :icon="Flame" />
      <UiStat
        label="Done today"
        :value="`${overview.checkedInToday}/${overview.totalHabits}`"
        :icon="CheckCircle2"
      />
      <UiStat label="Best current streak" :count="overview.bestCurrentStreak" :formatter="(n) => `${n} ${n === 1 ? 'day' : 'days'}`" :icon="Trophy" />
    </div>

    <!-- Heatmap + weekly chart -->
    <div class="grid gap-4 lg:grid-cols-2">
      <UiCard>
        <h2 class="text-base font-bold text-ink">Six month heatmap</h2>
        <p class="mb-4 mt-0.5 text-sm text-ink-mid">Each square is a day. Darker means more check-ins.</p>
        <HabitHeatmap v-if="overview" :days="overview.heatmap" />
      </UiCard>
      <UiCard>
        <h2 class="text-base font-bold text-ink">Check-ins per week</h2>
        <p class="mb-4 mt-0.5 text-sm text-ink-mid">The last 12 weeks.</p>
        <WeeklyBarChart v-if="overview" :weeks="overview.weeklyCounts" />
      </UiCard>
    </div>

    <!-- Habit list -->
    <section aria-label="Habit list">
      <div v-if="loading" class="grid gap-3">
        <div v-for="i in 3" :key="i" class="surface h-24 animate-pulse" />
      </div>

      <UiCard v-else-if="activeHabits.length === 0" :padded="false">
        <UiEmptyState
          title="No habits yet"
          description="Start small. Reading for 20 minutes a day is a classic first habit."
        >
          <UiButton @click="openCreate">
            <Plus class="size-4" aria-hidden="true" />
            Create your first habit
          </UiButton>
        </UiEmptyState>
      </UiCard>

      <div v-else class="stagger flex flex-col gap-3">
        <div v-for="habit in activeHabits" :key="habit.id" class="surface p-4 sm:p-5">
          <div class="flex flex-wrap items-center gap-4">
            <!-- Identity -->
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div
                class="flex size-11 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong text-white"
                :style="{ background: habit.color }"
              >
                <component :is="habitIcon(habit.icon)" class="size-5" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="truncate font-bold text-ink">{{ habit.name }}</p>
                <p class="flex items-center gap-2 text-sm text-ink-mid">
                  <span class="inline-flex items-center gap-1">
                    <Flame class="size-3.5 text-warning" aria-hidden="true" />
                    <span class="tabular-nums font-semibold">{{ habit.currentStreak }}</span> day streak
                  </span>
                  <span class="text-ink-faint">· best {{ habit.longestStreak }}</span>
                </p>
              </div>
            </div>

            <!-- Week dots -->
            <div class="flex items-center gap-1.5" role="group" :aria-label="`Check-ins for ${habit.name}, last 7 days`">
              <div v-for="date in week" :key="date" class="flex flex-col items-center gap-1">
                <span class="text-[10px] font-medium text-ink-faint">{{ dayLabel(date) }}</span>
                <button
                  type="button"
                  class="press flex size-8 items-center justify-center rounded-sm border-2 transition-colors"
                  :class="
                    habit.last7Days.includes(date)
                      ? 'border-line-strong text-white'
                      : 'border-line-strong text-transparent hover:bg-accent-soft'
                  "
                  :style="habit.last7Days.includes(date) ? { background: habit.color } : {}"
                  :aria-label="`${habit.last7Days.includes(date) ? 'Remove check-in for' : 'Check in on'} ${date}`"
                  :aria-pressed="habit.last7Days.includes(date)"
                  @click="toggleDay(habit, date)"
                >
                  <Check class="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1">
              <UiBadge v-if="habit.checkedInToday" kind="success">Done today</UiBadge>
              <button
                type="button"
                class="press flex size-9 items-center justify-center rounded-sm text-ink-mid hover:bg-accent-soft hover:text-ink"
                :aria-label="`Edit ${habit.name}`"
                @click="openEdit(habit)"
              >
                <Pencil class="size-4" />
              </button>
              <button
                type="button"
                class="press flex size-9 items-center justify-center rounded-sm text-ink-mid hover:bg-danger-soft hover:text-danger"
                :aria-label="`Delete ${habit.name}`"
                @click="deleting = habit"
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <details v-if="archivedHabits.length" class="mt-2">
          <summary class="cursor-pointer text-sm font-medium text-ink-faint hover:text-ink">
            Archived ({{ archivedHabits.length }})
          </summary>
          <div class="mt-3 flex flex-col gap-2">
            <div v-for="habit in archivedHabits" :key="habit.id" class="surface flex items-center gap-3 p-4 opacity-70">
              <component :is="habitIcon(habit.icon)" class="size-5 text-ink-mid" aria-hidden="true" />
              <span class="flex-1 font-medium text-ink">{{ habit.name }}</span>
              <UiButton size="sm" variant="ghost" @click="openEdit(habit)">Restore or edit</UiButton>
            </div>
          </div>
        </details>
      </div>
    </section>

    <HabitFormModal :open="formOpen" :habit="editing" :saving="saving" @close="formOpen = false" @save="save" />

    <UiModal :open="!!deleting" title="Delete habit" size="sm" @close="deleting = null">
      <p class="text-ink-mid">
        Delete <strong class="text-ink">{{ deleting?.name }}</strong>? Its check-in history stays in your
        statistics, but the habit leaves your daily list.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="deleting = null">Cancel</UiButton>
          <UiButton variant="danger" :loading="saving" @click="confirmDelete">Delete</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>
