<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', loading: false, disabled: false, block: false },
)

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-sm press select-none transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-12 px-7 text-base',
  }
  // Bordered variants sink into their shadow on press (mechanical click).
  const variants = {
    primary:
      'bg-accent text-on-accent border-2 border-line-strong shadow-button press-shadow hover:bg-accent-strong',
    secondary:
      'bg-solid text-ink border-2 border-line-strong shadow-button press-shadow hover:bg-accent-soft',
    ghost: 'bg-transparent text-ink-mid hover:bg-accent-soft hover:text-ink',
    danger:
      'bg-danger-soft text-danger border-2 border-(--color-danger) shadow-button press-shadow hover:bg-danger hover:text-white',
  }
  return [base, sizes[props.size], variants[props.variant], props.block ? 'w-full' : ''].join(' ')
})
</script>

<template>
  <button :type="type" :class="classes" :disabled="disabled || loading">
    <Loader2 v-if="loading" class="size-4 animate-spin" aria-hidden="true" />
    <slot />
  </button>
</template>
