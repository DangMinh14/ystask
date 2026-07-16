<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{ open: boolean; title: string; size?: 'sm' | 'md' | 'lg' }>(),
  { size: 'md' },
)

const emit = defineEmits<{ close: [] }>()

// Close on Escape while open.
watch(
  () => props.open,
  (open) => {
    if (open) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-2000 flex items-end justify-center p-0 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="absolute inset-0 bg-(--scrim)" @click="emit('close')" />
        <div
          class="modal-panel relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-md border-2 border-line-strong bg-(--surface-solid) shadow-pop sm:rounded-md"
          :class="{ 'sm:max-w-md': size === 'sm', 'sm:max-w-xl': size === 'md', 'sm:max-w-3xl': size === 'lg' }"
        >
          <header class="flex items-center justify-between gap-4 border-b-2 border-line-strong px-5 py-4 sm:px-6">
            <h2 class="text-lg font-bold text-ink">{{ title }}</h2>
            <button
              type="button"
              class="press flex size-9 items-center justify-center rounded-sm border-2 border-line-strong text-ink hover:bg-accent-soft"
              aria-label="Close"
              @click="emit('close')"
            >
              <X class="size-5" />
            </button>
          </header>
          <div class="overflow-y-auto px-5 py-5 sm:px-6">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="border-t-2 border-line-strong px-5 py-4 sm:px-6">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity var(--motion-base) var(--ease-standard);
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform var(--motion-base) var(--ease-snap), opacity var(--motion-base) var(--ease-standard);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
/* Never intercept clicks while the closing animation plays. */
.modal-leave-active {
  pointer-events: none;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(18px) scale(0.97);
  opacity: 0;
}
</style>
