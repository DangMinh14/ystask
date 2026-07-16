<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'
import { useToastStore } from '../../stores/toast'

const store = useToastStore()

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 top-4 z-3000 flex flex-col items-center gap-2 px-4" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in store.toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-sm border-2 border-line-strong bg-(--surface-elevated) px-4 py-3 shadow-card"
        >
          <component
            :is="icons[toast.kind]"
            class="size-5 shrink-0"
            :class="{
              'text-success': toast.kind === 'success',
              'text-danger': toast.kind === 'error',
              'text-info': toast.kind === 'info',
              'text-warning': toast.kind === 'warning',
            }"
            aria-hidden="true"
          />
          <p class="flex-1 text-sm font-medium text-ink">{{ toast.message }}</p>
          <button
            type="button"
            class="press text-ink-faint hover:text-ink"
            aria-label="Dismiss notification"
            @click="store.dismiss(toast.id)"
          >
            <X class="size-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all var(--motion-base) var(--ease-snap);
}
.toast-leave-active {
  pointer-events: none;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-14px) rotate(-1deg);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
