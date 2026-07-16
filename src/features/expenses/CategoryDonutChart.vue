<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type TooltipItem } from 'chart.js'
import type { CategoryTotal } from '../../services/expensesService'
import { formatVND } from '../../utils/money'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{ categories: CategoryTotal[] }>()

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartData = computed(() => ({
  labels: props.categories.map((c) => c.name),
  datasets: [
    {
      data: props.categories.map((c) => c.total),
      backgroundColor: props.categories.map((c) => c.color),
      borderWidth: 2,
      borderColor: cssVar('--border-strong'),
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
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
        label: (item: TooltipItem<'doughnut'>) => ` ${item.label}: ${formatVND(item.parsed)}`,
      },
    },
  },
}))
</script>

<template>
  <div class="h-72">
    <Doughnut :data="chartData" :options="chartOptions" aria-label="Spending by category" />
  </div>
</template>
