<script setup lang="ts">
import type { FunctionalComponent } from 'vue'
import { Inbox } from 'lucide-vue-next'

withDefaults(
  defineProps<{ title: string; description?: string; icon?: FunctionalComponent }>(),
  { icon: undefined },
)
</script>

<template>
  <div class="flex flex-col items-center gap-3 px-6 py-12 text-center">
    <div class="flex size-14 rotate-[-3deg] items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong shadow-button">
      <component :is="icon ?? Inbox" class="size-7" aria-hidden="true" />
    </div>
    <h3 class="text-base font-bold text-ink">{{ title }}</h3>
    <p v-if="description" class="max-w-sm text-sm text-ink-mid">{{ description }}</p>
    <div v-if="$slots.default" class="mt-2">
      <slot />
    </div>
  </div>
</template>
