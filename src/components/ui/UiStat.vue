<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { FunctionalComponent } from 'vue'
import { useCountUp } from '../../composables/useCountUp'

const props = defineProps<{
  label: string
  /** Static text value. Ignored when `count` is provided. */
  value?: string
  /** Numeric value to animate with a count-up on mount. */
  count?: number
  /** Formats the animated count, e.g. currency. Defaults to rounded integer. */
  formatter?: (n: number) => string
  sub?: string
  icon?: FunctionalComponent
  tone?: 'accent' | 'danger' | 'warning' | 'info'
}>()

const animated = useCountUp(toRef(() => props.count ?? 0))

const shown = computed(() => {
  if (props.count === undefined) return props.value ?? ''
  const n = animated.value
  return props.formatter ? props.formatter(Math.round(n)) : String(Math.round(n))
})
</script>

<template>
  <div class="surface flex items-start gap-4 p-5">
    <div
      v-if="icon"
      class="flex size-11 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong"
      :class="{
        'bg-accent-soft text-accent-strong': !tone || tone === 'accent',
        'bg-danger-soft text-danger': tone === 'danger',
        'bg-warning-soft text-warning': tone === 'warning',
        'bg-info-soft text-info': tone === 'info',
      }"
    >
      <component :is="icon" class="size-5" aria-hidden="true" />
    </div>
    <div class="min-w-0">
      <p class="text-sm font-medium text-ink-mid">{{ label }}</p>
      <p class="tabular-nums truncate text-2xl font-bold text-ink">{{ shown }}</p>
      <p v-if="sub" class="mt-0.5 text-xs text-ink-faint">{{ sub }}</p>
    </div>
  </div>
</template>
