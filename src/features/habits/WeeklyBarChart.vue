<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from 'chart.js'
import type { WeeklyCount } from '../../services/habitsService'
import { formatShort } from '../../utils/date'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{ weeks: WeeklyCount[] }>()

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => ({
  labels: props.weeks.map((w) => formatShort(w.weekStart)),
  datasets: [
    {
      data: props.weeks.map((w) => w.count),
      backgroundColor: cssVar('--accent-color'),
      borderColor: cssVar('--border-strong'),
      borderWidth: 2,
      borderRadius: 4,
      maxBarThickness: 26,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: {
      callbacks: {
        title: (items: TooltipItem<'bar'>[]) => `Week of ${items[0]?.label ?? ''}`,
        label: (item: TooltipItem<'bar'>) => ` ${item.parsed.y ?? 0} check-ins`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: cssVar('--text-faint'), font: { size: 10 } },
    },
    y: {
      beginAtZero: true,
      ticks: { color: cssVar('--text-faint'), precision: 0 },
      grid: { color: cssVar('--border-subtle') },
    },
  },
}))
</script>

<template>
  <div class="h-52">
    <Bar :data="chartData" :options="chartOptions" aria-label="Check-ins per week for the last 12 weeks" />
  </div>
</template>
