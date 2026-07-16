<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import UiSelect from '../../../components/ui/UiSelect.vue'

interface Unit {
  id: string
  label: string
  /** Factor to the base unit; temperature handled separately. */
  factor: number
}

const CATEGORIES: Record<string, { label: string; units: Unit[] }> = {
  length: {
    label: 'Length',
    units: [
      { id: 'mm', label: 'Millimeter (mm)', factor: 0.001 },
      { id: 'cm', label: 'Centimeter (cm)', factor: 0.01 },
      { id: 'm', label: 'Meter (m)', factor: 1 },
      { id: 'km', label: 'Kilometer (km)', factor: 1000 },
      { id: 'in', label: 'Inch (in)', factor: 0.0254 },
      { id: 'ft', label: 'Feet (ft)', factor: 0.3048 },
      { id: 'mi', label: 'Mile (mi)', factor: 1609.344 },
    ],
  },
  weight: {
    label: 'Weight',
    units: [
      { id: 'mg', label: 'Milligram (mg)', factor: 0.000001 },
      { id: 'g', label: 'Gram (g)', factor: 0.001 },
      { id: 'kg', label: 'Kilogram (kg)', factor: 1 },
      { id: 't', label: 'Tonne (t)', factor: 1000 },
      { id: 'oz', label: 'Ounce (oz)', factor: 0.0283495 },
      { id: 'lb', label: 'Pound (lb)', factor: 0.453592 },
    ],
  },
  temperature: {
    label: 'Temperature',
    units: [
      { id: 'c', label: 'Celsius (°C)', factor: 1 },
      { id: 'f', label: 'Fahrenheit (°F)', factor: 1 },
      { id: 'k', label: 'Kelvin (K)', factor: 1 },
    ],
  },
  data: {
    label: 'Data',
    units: [
      { id: 'b', label: 'Byte (B)', factor: 1 },
      { id: 'kb', label: 'Kilobyte (KB)', factor: 1024 },
      { id: 'mb', label: 'Megabyte (MB)', factor: 1024 ** 2 },
      { id: 'gb', label: 'Gigabyte (GB)', factor: 1024 ** 3 },
      { id: 'tb', label: 'Terabyte (TB)', factor: 1024 ** 4 },
    ],
  },
  speed: {
    label: 'Speed',
    units: [
      { id: 'kmh', label: 'Kilometers per hour (km/h)', factor: 1 },
      { id: 'ms', label: 'Meters per second (m/s)', factor: 3.6 },
      { id: 'mph', label: 'Miles per hour (mph)', factor: 1.609344 },
      { id: 'knot', label: 'Knots (kn)', factor: 1.852 },
    ],
  },
}

const category = ref('length')
const fromUnit = ref('m')
const toUnit = ref('km')
const amount = ref<number | string>(1)

const categoryOptions = Object.entries(CATEGORIES).map(([value, c]) => ({ value, label: c.label }))
const unitOptions = computed(() =>
  CATEGORIES[category.value]!.units.map((u) => ({ value: u.id, label: u.label })),
)

watch(category, (next) => {
  const units = CATEGORIES[next]!.units
  fromUnit.value = units[0]!.id
  toUnit.value = units[1]?.id ?? units[0]!.id
})

function convertTemperature(value: number, from: string, to: string): number {
  // Normalize to Celsius first
  const celsius = from === 'f' ? ((value - 32) * 5) / 9 : from === 'k' ? value - 273.15 : value
  if (to === 'f') return (celsius * 9) / 5 + 32
  if (to === 'k') return celsius + 273.15
  return celsius
}

const result = computed(() => {
  const value = Number(amount.value)
  if (!Number.isFinite(value)) return null
  if (category.value === 'temperature') {
    return convertTemperature(value, fromUnit.value, toUnit.value)
  }
  const units = CATEGORIES[category.value]!.units
  const from = units.find((u) => u.id === fromUnit.value)
  const to = units.find((u) => u.id === toUnit.value)
  if (!from || !to) return null
  return (value * from.factor) / to.factor
})

const formatted = computed(() => {
  if (result.value === null) return '-'
  return result.value.toLocaleString('en-US', { maximumFractionDigits: 6 })
})

function swap() {
  ;[fromUnit.value, toUnit.value] = [toUnit.value, fromUnit.value]
}
</script>

<template>
  <div class="surface flex flex-col gap-5 p-5 sm:p-6">
    <UiSelect v-model="category" label="Unit type" :options="categoryOptions" />

    <div class="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div class="flex flex-col gap-3">
        <UiSelect v-model="fromUnit" label="From" :options="unitOptions" />
        <input
          v-model="amount"
          type="number"
          inputmode="decimal"
          aria-label="Value to convert"
          class="h-11 w-full rounded-sm border border-line-strong bg-solid px-3.5 text-base text-ink focus:border-accent"
        />
      </div>

      <button
        type="button"
        class="press mx-auto mb-1 flex size-11 items-center justify-center rounded-sm bg-accent-soft text-accent hover:bg-accent hover:text-on-accent"
        aria-label="Swap conversion direction"
        @click="swap"
      >
        <ArrowLeftRight class="size-5" />
      </button>

      <div class="flex flex-col gap-3">
        <UiSelect v-model="toUnit" label="To" :options="unitOptions" />
        <output
          class="tabular-nums flex h-11 items-center overflow-x-auto rounded-sm border border-line bg-accent-soft px-3.5 text-base font-bold text-accent-strong"
          aria-live="polite"
        >
          {{ formatted }}
        </output>
      </div>
    </div>
  </div>
</template>
