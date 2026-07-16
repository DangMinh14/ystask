<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ kind?: 'accent' | 'neutral' | 'danger' | 'warning' | 'success' | 'info' }>(),
  { kind: 'neutral' },
)

const classes = computed(() => {
  const kinds = {
    accent: 'bg-accent-soft text-accent-strong border-(--accent-color)',
    neutral: 'bg-(--surface-solid) text-ink-mid border-line-strong',
    danger: 'bg-danger-soft text-danger border-(--color-danger)',
    warning: 'bg-warning-soft text-warning border-(--color-warning)',
    success: 'bg-success-soft text-success border-(--color-success)',
    info: 'bg-info-soft text-info border-(--color-info)',
  }
  return kinds[props.kind]
})
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 text-xs font-semibold"
    :class="classes"
  >
    <slot />
  </span>
</template>
