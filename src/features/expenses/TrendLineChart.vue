<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import type { MonthPoint } from '../../services/expensesService'
import { formatVND, formatVNDCompact } from '../../utils/money'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler)

const props = defineProps<{ trend: MonthPoint[] }>()

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => ({
  labels: props.trend.map((p) => `${MONTHS[p.month - 1]} ${String(p.year).slice(2)}`),
  datasets: [
    {
      label: 'Income',
      data: props.trend.map((p) => p.income),
      borderColor: cssVar('--color-success'),
      backgroundColor: 'transparent',
      borderWidth: 3,
      tension: 0.35,
      pointRadius: 3,
    },
    {
      label: 'Spending',
      data: props.trend.map((p) => p.expense),
      borderColor: cssVar('--color-danger'),
      backgroundColor: 'transparent',
      borderWidth: 3,
      tension: 0.35,
      pointRadius: 3,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: cssVar('--text-secondary'),
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 14,
        font: { size: 12 },
      },
    },
    tooltip: {
      callbacks: {
        label: (item: TooltipItem<'line'>) =>
          ` ${item.dataset.label}: ${formatVND(item.parsed.y ?? 0)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: cssVar('--text-faint'), font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: cssVar('--border-subtle') },
      ticks: {
        color: cssVar('--text-faint'),
        font: { size: 11 },
        callback: (value: string | number) => formatVNDCompact(Number(value)),
      },
    },
  },
}))
</script>

<template>
  <div class="h-72">
    <Line :data="chartData" :options="chartOptions" aria-label="Income and spending trend for the last 6 months" />
  </div>
</template>
