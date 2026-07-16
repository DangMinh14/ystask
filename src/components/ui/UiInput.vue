<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    required?: boolean
    error?: string
    hint?: string
    autocomplete?: string
    min?: string | number
    max?: string | number
    step?: string | number
  }>(),
  { type: 'text' },
)

const model = defineModel<string | number>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-semibold text-ink">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      v-model="model"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :min="min"
      :max="max"
      :step="step"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      class="h-11 w-full rounded-sm border-2 bg-solid px-3.5 text-base text-ink placeholder:text-ink-faint transition-colors duration-150"
      :class="error ? 'border-(--color-danger)' : 'border-line-strong focus:border-(--accent-color)'"
    />
    <p v-if="error" :id="`${id}-error`" role="alert" class="text-sm font-medium text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-sm text-ink-faint">{{ hint }}</p>
  </div>
</template>
