<script setup lang="ts">
import { computed, ref } from 'vue'
import UiInput from '../../../components/ui/UiInput.vue'

type UnitSystem = 'metric' | 'imperial'

const system = ref<UnitSystem>('metric')

const heightCm = ref<number | string>(170)
const weightKg = ref<number | string>(65)
const heightFt = ref<number | string>(5)
const heightIn = ref<number | string>(7)
const weightLb = ref<number | string>(143)

const heightMeters = computed(() => {
  if (system.value === 'metric') {
    const cm = Number(heightCm.value)
    return cm > 0 ? cm / 100 : null
  }
  const ft = Number(heightFt.value)
  const inch = Number(heightIn.value)
  const total = ft * 12 + (Number.isFinite(inch) ? inch : 0)
  return total > 0 ? total * 0.0254 : null
})

const weightInKg = computed(() => {
  const raw = system.value === 'metric' ? Number(weightKg.value) : Number(weightLb.value) * 0.453592
  return raw > 0 ? raw : null
})

const bmi = computed(() => {
  if (!heightMeters.value || !weightInKg.value) return null
  const value = weightInKg.value / (heightMeters.value * heightMeters.value)
  return value > 0 && value < 200 ? value : null
})

interface BmiBand {
  label: string
  max: number
  tone: string
  advice: string
}

// WHO adult classification.
const BANDS: BmiBand[] = [
  { label: 'Underweight', max: 18.5, tone: 'text-info', advice: 'Below the healthy range. Consider talking to a doctor or nutritionist.' },
  { label: 'Healthy', max: 25, tone: 'text-success', advice: 'Within the healthy range. Keep doing what you are doing.' },
  { label: 'Overweight', max: 30, tone: 'text-warning', advice: 'Above the healthy range. Small changes in diet and movement help.' },
  { label: 'Obese', max: Infinity, tone: 'text-danger', advice: 'Well above the healthy range. A health professional can help you plan.' },
]

const band = computed(() => (bmi.value === null ? null : BANDS.find((b) => bmi.value! < b.max) ?? BANDS.at(-1)!))

/** Position of the marker on the 15 to 40 scale, clamped. */
const markerPercent = computed(() => {
  if (bmi.value === null) return 0
  const clamped = Math.min(40, Math.max(15, bmi.value))
  return ((clamped - 15) / 25) * 100
})

const healthyRange = computed(() => {
  if (!heightMeters.value) return null
  const h2 = heightMeters.value * heightMeters.value
  const min = 18.5 * h2
  const max = 24.9 * h2
  if (system.value === 'metric') {
    return `${min.toFixed(1)} to ${max.toFixed(1)} kg`
  }
  return `${(min / 0.453592).toFixed(0)} to ${(max / 0.453592).toFixed(0)} lb`
})
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="surface flex flex-col gap-4 p-5">
      <div class="flex gap-2" role="group" aria-label="Unit system">
        <button
          v-for="option in (['metric', 'imperial'] as const)"
          :key="option"
          type="button"
          class="press flex-1 rounded-sm border-2 border-line-strong px-3 py-2 text-sm font-semibold"
          :class="system === option ? 'bg-accent text-on-accent shadow-button' : 'bg-solid text-ink-mid hover:bg-accent-soft'"
          :aria-pressed="system === option"
          @click="system = option"
        >
          {{ option === 'metric' ? 'Metric (cm, kg)' : 'Imperial (ft, lb)' }}
        </button>
      </div>

      <template v-if="system === 'metric'">
        <UiInput v-model="heightCm" label="Height (cm)" type="number" min="50" max="272" step="0.5" />
        <UiInput v-model="weightKg" label="Weight (kg)" type="number" min="10" max="500" step="0.1" />
      </template>
      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <UiInput v-model="heightFt" label="Height (ft)" type="number" min="1" max="8" step="1" />
          <UiInput v-model="heightIn" label="Height (in)" type="number" min="0" max="11" step="1" />
        </div>
        <UiInput v-model="weightLb" label="Weight (lb)" type="number" min="20" max="1100" step="0.5" />
      </template>

      <p class="text-sm text-ink-faint">
        BMI is a rough screening number for adults. It does not account for muscle mass, age, or body composition.
      </p>
    </div>

    <div class="surface flex flex-col gap-5 p-6">
      <div class="text-center" aria-live="polite">
        <p class="text-eyebrow">Your BMI</p>
        <p class="tabular-nums mt-1 text-5xl font-bold text-ink">{{ bmi === null ? '-' : bmi.toFixed(1) }}</p>
        <p v-if="band" class="mt-1 text-lg font-bold" :class="band.tone">{{ band.label }}</p>
      </div>

      <!-- Scale -->
      <div v-if="bmi !== null">
        <div class="relative h-4 overflow-hidden rounded-sm border-2 border-line-strong">
          <div class="absolute inset-0 flex">
            <div class="h-full bg-(--color-info)" style="width: 14%" />
            <div class="h-full bg-(--color-success)" style="width: 26%" />
            <div class="h-full bg-(--color-warning)" style="width: 20%" />
            <div class="h-full bg-(--color-danger)" style="width: 40%" />
          </div>
          <div
            class="absolute top-0 h-full w-1.5 -translate-x-1/2 border-x-2 border-line-strong bg-white transition-[left] duration-300"
            :style="{ left: `${markerPercent}%` }"
            aria-hidden="true"
          />
        </div>
        <div class="mt-1 flex justify-between font-mono text-[11px] text-ink-faint" aria-hidden="true">
          <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
        </div>
      </div>

      <div v-if="band" class="rounded-sm border-2 border-line-strong bg-solid p-4">
        <p class="text-sm text-ink-mid">{{ band.advice }}</p>
        <p v-if="healthyRange" class="mt-2 text-sm text-ink">
          Healthy weight for your height: <strong class="tabular-nums">{{ healthyRange }}</strong>
        </p>
      </div>
      <p v-else class="text-center text-sm text-ink-faint">Enter your height and weight to see the result.</p>
    </div>
  </div>
</template>
