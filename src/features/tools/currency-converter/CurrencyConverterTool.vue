<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeftRight, RefreshCw } from 'lucide-vue-next'
import UiSelect from '../../../components/ui/UiSelect.vue'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'VND', label: 'Vietnamese Dong (VND)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
  { code: 'KRW', label: 'South Korean Won (KRW)' },
  { code: 'CNY', label: 'Chinese Yuan (CNY)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'THB', label: 'Thai Baht (THB)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'HKD', label: 'Hong Kong Dollar (HKD)' },
]

// Approximate rates per 1 USD, used until live rates load or when offline.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  VND: 25400,
  GBP: 0.79,
  JPY: 155,
  KRW: 1370,
  CNY: 7.25,
  SGD: 1.34,
  THB: 36.5,
  AUD: 1.5,
  CAD: 1.37,
  CHF: 0.89,
  INR: 83.5,
  HKD: 7.8,
}

const CACHE_KEY = 'ystask-fx-rates'
const CACHE_TTL = 12 * 60 * 60 * 1000 // 12 hours

const amount = ref<number | string>(100)
const fromCode = ref('USD')
const toCode = ref('VND')
const rates = ref<Record<string, number>>(FALLBACK_RATES)
const ratesDate = ref<string | null>(null)
const source = ref<'live' | 'cache' | 'fallback'>('fallback')
const loading = ref(false)

const options = CURRENCIES.map((c) => ({ value: c.code, label: c.label }))

async function loadRates(force = false) {
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as {
        savedAt: number
        date: string
        rates: Record<string, number>
      } | null
      if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
        rates.value = cached.rates
        ratesDate.value = cached.date
        source.value = 'cache'
        return
      }
    } catch {
      /* bad cache, fetch fresh */
    }
  }

  loading.value = true
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error('rate fetch failed')
    const data = (await res.json()) as { result: string; rates: Record<string, number>; time_last_update_utc: string }
    if (data.result !== 'success') throw new Error('rate fetch failed')
    rates.value = data.rates
    ratesDate.value = new Date(data.time_last_update_utc).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    source.value = 'live'
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), date: ratesDate.value, rates: data.rates }),
    )
  } catch {
    source.value = ratesDate.value ? source.value : 'fallback'
  } finally {
    loading.value = false
  }
}

const result = computed(() => {
  const value = Number(amount.value)
  const from = rates.value[fromCode.value]
  const to = rates.value[toCode.value]
  if (!Number.isFinite(value) || !from || !to) return null
  return (value / from) * to
})

const unitRate = computed(() => {
  const from = rates.value[fromCode.value]
  const to = rates.value[toCode.value]
  if (!from || !to) return null
  return to / from
})

function formatCurrency(value: number, code: string): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: code === 'VND' || code === 'KRW' || code === 'JPY' ? 0 : 2,
  })
}

const formattedResult = computed(() =>
  result.value === null ? '-' : formatCurrency(result.value, toCode.value),
)

function swap() {
  ;[fromCode.value, toCode.value] = [toCode.value, fromCode.value]
}

onMounted(() => loadRates())
</script>

<template>
  <div class="surface flex flex-col gap-5 p-5 sm:p-6">
    <div class="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div class="flex flex-col gap-3">
        <UiSelect v-model="fromCode" label="From" :options="options" />
        <input
          v-model="amount"
          type="number"
          inputmode="decimal"
          min="0"
          aria-label="Amount to convert"
          class="h-11 w-full rounded-sm border-2 border-line-strong bg-solid px-3.5 text-base text-ink focus:border-(--accent-color)"
        />
      </div>

      <button
        type="button"
        class="press mx-auto mb-1 flex size-11 items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong hover:bg-accent hover:text-on-accent"
        aria-label="Swap currencies"
        @click="swap"
      >
        <ArrowLeftRight class="size-5" />
      </button>

      <div class="flex flex-col gap-3">
        <UiSelect v-model="toCode" label="To" :options="options" />
        <output
          class="tabular-nums flex h-11 items-center overflow-x-auto rounded-sm border-2 border-line-strong bg-accent-soft px-3.5 text-base font-bold text-accent-strong"
          aria-live="polite"
        >
          {{ formattedResult }}
        </output>
      </div>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 border-t-2 border-line pt-4">
      <p v-if="unitRate" class="tabular-nums text-sm text-ink-mid">
        1 {{ fromCode }} = {{ unitRate.toLocaleString('en-US', { maximumFractionDigits: unitRate > 100 ? 0 : 4 }) }} {{ toCode }}
      </p>
      <div class="flex items-center gap-3">
        <p class="text-xs text-ink-faint">
          <template v-if="source === 'live'">Live rates, updated {{ ratesDate }}.</template>
          <template v-else-if="source === 'cache'">Rates from {{ ratesDate }} (cached).</template>
          <template v-else>Approximate offline rates. Refresh to fetch live ones.</template>
        </p>
        <button
          type="button"
          class="press flex size-8 items-center justify-center rounded-sm border-2 border-line-strong text-ink-mid hover:bg-accent-soft hover:text-ink"
          aria-label="Refresh rates"
          :disabled="loading"
          @click="loadRates(true)"
        >
          <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <p class="text-xs text-ink-faint">
      Rates are for reference only and come from an open ECB-style feed. Banks and card networks apply their own spread.
    </p>
  </div>
</template>
