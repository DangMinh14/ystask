<script setup lang="ts">
import { useId } from 'vue'

export interface SelectOption {
  value: string | number
  label: string
}

defineProps<{
  label?: string
  options: SelectOption[]
  required?: boolean
  error?: string
  placeholder?: string
}>()

const model = defineModel<string | number>()
const id = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-semibold text-ink">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>
    <select
      :id="id"
      v-model="model"
      :required="required"
      :aria-invalid="!!error"
      class="h-11 w-full cursor-pointer appearance-none rounded-sm border-2 bg-solid bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m4%206%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat px-3.5 pr-10 text-base text-ink transition-colors duration-150"
      :class="error ? 'border-(--color-danger)' : 'border-line-strong focus:border-(--accent-color)'"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
    <p v-if="error" role="alert" class="text-sm font-medium text-danger">{{ error }}</p>
  </div>
</template>
