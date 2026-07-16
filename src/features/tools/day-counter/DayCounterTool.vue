<script setup lang="ts">
import { computed, ref } from 'vue'
import UiInput from '../../../components/ui/UiInput.vue'

function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function parseISO(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

const today = new Date()
const startDate = ref(toISO(today))
const endDate = ref(toISO(new Date(today.getFullYear(), 11, 31)))
const includeEndDay = ref(false)

const DAY_MS = 24 * 60 * 60 * 1000

const diff = computed(() => {
  const start = parseISO(startDate.value)
  const end = parseISO(endDate.value)
  if (!start || !end) return null

  const rawDays = Math.round((end.getTime() - start.getTime()) / DAY_MS)
  const days = rawDays + (includeEndDay.value ? Math.sign(rawDays || 1) : 0)
  const abs = Math.abs(days)

  // Count weekdays and weekend days between the two dates.
  let weekdays = 0
  const step = rawDays >= 0 ? 1 : -1
  const cursor = new Date(start)
  for (let i = 0; i < Math.abs(rawDays) + (includeEndDay.value ? 1 : 0); i++) {
    if (includeEndDay.value === false) cursor.setDate(cursor.getDate() + step)
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) weekdays++
    if (includeEndDay.value) cursor.setDate(cursor.getDate() + step)
  }

  return {
    days,
    abs,
    weeks: Math.floor(abs / 7),
    remDays: abs % 7,
    weekdays,
    weekendDays: Math.abs(rawDays) + (includeEndDay.value ? 1 : 0) - weekdays,
    direction: days === 0 ? 'same' : days > 0 ? 'forward' : 'backward',
  }
})

const headline = computed(() => {
  if (!diff.value) return null
  if (diff.value.days === 0) return 'Same day'
  return `${diff.value.abs.toLocaleString('en-US')} ${diff.value.abs === 1 ? 'day' : 'days'}`
})

function preset(kind: 'today-newyear' | 'today-plus30' | 'today-plus100' | 'year-so-far') {
  const now = new Date()
  if (kind === 'today-newyear') {
    startDate.value = toISO(now)
    endDate.value = `${now.getFullYear() + 1}-01-01`
  } else if (kind === 'today-plus30') {
    startDate.value = toISO(now)
    endDate.value = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30))
  } else if (kind === 'today-plus100') {
    startDate.value = toISO(now)
    endDate.value = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 100))
  } else {
    startDate.value = `${now.getFullYear()}-01-01`
    endDate.value = toISO(now)
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="surface flex flex-col gap-4 p-5">
      <UiInput v-model="startDate" label="Start date" type="date" />
      <UiInput v-model="endDate" label="End date" type="date" />

      <label class="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input
          v-model="includeEndDay"
          type="checkbox"
          class="size-4.5 accent-(--accent-color)"
        />
        Count the end date as a full day
      </label>

      <div class="border-t-2 border-line pt-4">
        <p class="text-eyebrow">Quick picks</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="p in ([
              { id: 'today-newyear', label: 'Until New Year' },
              { id: 'today-plus30', label: 'Today + 30' },
              { id: 'today-plus100', label: 'Today + 100' },
              { id: 'year-so-far', label: 'This year so far' },
            ] as const)"
            :key="p.id"
            type="button"
            class="press rounded-sm border-2 border-line-strong bg-solid px-3 py-1.5 text-sm font-semibold text-ink-mid hover:bg-accent-soft hover:text-ink"
            @click="preset(p.id)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="surface flex flex-col justify-center gap-5 p-6 text-center" aria-live="polite">
      <template v-if="diff">
        <div>
          <p class="text-eyebrow">{{ diff.direction === 'backward' ? 'Difference (end is before start)' : 'Difference' }}</p>
          <p class="tabular-nums mt-1 text-5xl font-bold text-accent-strong">{{ headline }}</p>
        </div>

        <div v-if="diff.abs > 0" class="grid grid-cols-2 gap-3 text-left">
          <div class="rounded-sm border-2 border-line-strong bg-solid p-3.5">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Weeks</p>
            <p class="tabular-nums mt-0.5 font-bold text-ink">
              {{ diff.weeks }} {{ diff.weeks === 1 ? 'week' : 'weeks' }}<span v-if="diff.remDays"> and {{ diff.remDays }} {{ diff.remDays === 1 ? 'day' : 'days' }}</span>
            </p>
          </div>
          <div class="rounded-sm border-2 border-line-strong bg-solid p-3.5">
            <p class="text-xs font-semibold uppercase tracking-wide text-ink-faint">Working days</p>
            <p class="tabular-nums mt-0.5 font-bold text-ink">{{ diff.weekdays }} weekdays, {{ diff.weekendDays }} weekend</p>
          </div>
        </div>

        <p class="text-sm text-ink-faint">
          {{ includeEndDay ? 'Both the start and end dates count.' : 'Counted from the start date, not including the end date.' }}
        </p>
      </template>
      <p v-else class="text-sm text-ink-faint">Pick two valid dates to see the difference.</p>
    </div>
  </div>
</template>
