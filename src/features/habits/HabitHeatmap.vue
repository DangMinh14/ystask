<script setup lang="ts">
import { computed } from 'vue'
import type { HeatmapDay } from '../../services/habitsService'
import { addDays, formatFull, todayISO } from '../../utils/date'

const props = withDefaults(defineProps<{ days: HeatmapDay[]; weeks?: number }>(), { weeks: 26 })

interface Cell {
  date: string
  count: number
  level: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const grid = computed<Cell[][]>(() => {
  const counts = new Map(props.days.map((d) => [d.date, d.count]))
  const today = todayISO()
  // Monday-based column for the current week.
  const [y, m, d] = today.split('-').map(Number)
  const dow = (new Date(y!, m! - 1, d!).getDay() + 6) % 7 // 0 = Monday
  const currentWeekMonday = addDays(today, -dow)

  const columns: Cell[][] = []
  for (let w = props.weeks - 1; w >= 0; w--) {
    const monday = addDays(currentWeekMonday, -7 * w)
    const column: Cell[] = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(monday, i)
      if (date > today) break
      const count = counts.get(date) ?? 0
      const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4
      column.push({ date, count, level })
    }
    columns.push(column)
  }
  return columns
})

const monthLabels = computed(() => {
  // Show a label where the month changes at the first row of a column.
  const labels: { index: number; label: string }[] = []
  let lastMonth = -1
  grid.value.forEach((column, index) => {
    const first = column[0]
    if (!first) return
    const month = Number(first.date.split('-')[1])
    if (month !== lastMonth) {
      labels.push({ index, label: MONTH_LABELS[month - 1]! })
      lastMonth = month
    }
  })
  return labels
})

const LEVEL_CLASSES = ['heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4']
</script>

<template>
  <div class="overflow-x-auto pb-1" role="img" aria-label="Check-in heatmap for the last 6 months">
    <div class="min-w-max">
      <div class="relative mb-1 h-4 text-[10px] text-ink-faint">
        <span
          v-for="label in monthLabels"
          :key="label.index"
          class="absolute font-mono"
          :style="{ left: `${label.index * 16}px` }"
        >
          {{ label.label }}
        </span>
      </div>
      <div class="flex gap-1">
        <div v-for="(column, wi) in grid" :key="wi" class="flex flex-col gap-1">
          <div
            v-for="cell in column"
            :key="cell.date"
            class="size-3 rounded-[3px]"
            :class="LEVEL_CLASSES[cell.level]"
            :title="`${formatFull(cell.date)}: ${cell.count} check-ins`"
          />
        </div>
      </div>
      <div class="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-ink-faint">
        Less
        <span v-for="l in 5" :key="l" class="size-3 rounded-[3px]" :class="LEVEL_CLASSES[l - 1]" />
        More
      </div>
    </div>
  </div>
</template>

<style scoped>
.heat-0 { background: var(--border-subtle); }
.heat-1 { background: color-mix(in srgb, var(--accent-color) 30%, transparent); }
.heat-2 { background: color-mix(in srgb, var(--accent-color) 55%, transparent); }
.heat-3 { background: color-mix(in srgb, var(--accent-color) 80%, transparent); }
.heat-4 { background: var(--accent-color); }
</style>
