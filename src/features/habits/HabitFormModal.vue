<script setup lang="ts">
import { ref, watch } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiModal from '../../components/ui/UiModal.vue'
import { HABIT_COLORS, HABIT_ICONS } from './habitIcons'
import type { HabitDto, HabitPayload } from '../../services/habitsService'

const props = defineProps<{ open: boolean; habit: HabitDto | null; saving: boolean }>()
const emit = defineEmits<{ close: []; save: [payload: HabitPayload & { isArchived: boolean }] }>()

const name = ref('')
const description = ref('')
const color = ref(HABIT_COLORS[0]!)
const icon = ref('target')
const targetPerWeek = ref(7)
const isArchived = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.habit?.name ?? ''
    description.value = props.habit?.description ?? ''
    color.value = props.habit?.color ?? HABIT_COLORS[0]!
    icon.value = props.habit?.icon ?? 'target'
    targetPerWeek.value = props.habit?.targetPerWeek ?? 7
    isArchived.value = props.habit?.isArchived ?? false
  },
)

function submit() {
  if (!name.value.trim()) return
  emit('save', {
    name: name.value.trim(),
    description: description.value.trim() || null,
    color: color.value,
    icon: icon.value,
    targetPerWeek: targetPerWeek.value,
    isArchived: isArchived.value,
  })
}
</script>

<template>
  <UiModal :open="open" :title="habit ? 'Edit habit' : 'New habit'" @close="emit('close')">
    <form id="habit-form" class="flex flex-col gap-4" @submit.prevent="submit">
      <UiInput v-model="name" label="Habit name" placeholder="Read for 20 minutes" required />
      <UiInput v-model="description" label="Description" placeholder="A short note, optional" />

      <div>
        <p class="text-sm font-semibold text-ink">Icon</p>
        <div class="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose an icon">
          <button
            v-for="(component, key) in HABIT_ICONS"
            :key="key"
            type="button"
            role="radio"
            :aria-checked="icon === key"
            class="press flex size-10 items-center justify-center rounded-sm border-2 transition-colors"
            :class="icon === key ? 'border-line-strong bg-accent-soft text-accent-strong shadow-button' : 'border-line text-ink-mid hover:border-line-strong'"
            @click="icon = key"
          >
            <component :is="component" class="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div>
        <p class="text-sm font-semibold text-ink">Color</p>
        <div class="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose a color">
          <button
            v-for="c in HABIT_COLORS"
            :key="c"
            type="button"
            role="radio"
            :aria-checked="color === c"
            class="press size-9 rounded-sm border-2 transition-transform"
            :class="color === c ? 'scale-110 border-line-strong shadow-button' : 'border-transparent'"
            :style="{ background: c }"
            :aria-label="`Color ${c}`"
            @click="color = c"
          />
        </div>
      </div>

      <div>
        <label for="habit-target" class="flex items-center justify-between text-sm font-semibold text-ink">
          Weekly target
          <span class="tabular-nums font-mono text-accent-strong">{{ targetPerWeek }} days</span>
        </label>
        <input
          id="habit-target"
          v-model.number="targetPerWeek"
          type="range"
          min="1"
          max="7"
          class="mt-2 w-full accent-(--accent-color)"
        />
      </div>

      <label v-if="habit" class="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
        <input v-model="isArchived" type="checkbox" class="size-4 accent-(--accent-color)" />
        Archive (hide from the daily list)
      </label>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="emit('close')">Cancel</UiButton>
        <UiButton type="submit" form="habit-form" :loading="saving" :disabled="!name.trim()">
          {{ habit ? 'Save changes' : 'Create habit' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
