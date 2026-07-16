<script setup lang="ts">
import { computed, ref } from 'vue'

const text = ref('')

const stats = computed(() => {
  const value = text.value
  const trimmed = value.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const sentences = trimmed ? (trimmed.match(/[.!?…]+(?=\s|$)/g)?.length ?? (trimmed ? 1 : 0)) : 0
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0
  return {
    chars: value.length,
    charsNoSpace: value.replace(/\s/g, '').length,
    words,
    sentences,
    paragraphs,
    // ~200 words/minute reading speed
    readingMinutes: Math.max(1, Math.ceil(words / 200)),
  }
})

const items = computed(() => [
  { label: 'Characters', value: stats.value.chars },
  { label: 'Characters (no spaces)', value: stats.value.charsNoSpace },
  { label: 'Words', value: stats.value.words },
  { label: 'Sentences', value: stats.value.sentences },
  { label: 'Paragraphs', value: stats.value.paragraphs },
  { label: 'Reading time (min, estimated)', value: stats.value.words ? stats.value.readingMinutes : 0 },
])
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="surface p-5">
      <label for="cc-input" class="text-sm font-medium text-ink">Your text</label>
      <textarea
        id="cc-input"
        v-model="text"
        rows="8"
        placeholder="Paste or type your text here…"
        class="mt-2 w-full resize-y rounded-sm border border-line-strong bg-solid p-3.5 text-base text-ink placeholder:text-ink-faint focus:border-accent"
      />
      <button
        v-if="text"
        type="button"
        class="mt-2 text-sm font-medium text-ink-mid hover:text-danger"
        @click="text = ''"
      >
        Clear text
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3" role="status" aria-live="polite">
      <div v-for="item in items" :key="item.label" class="surface p-4 text-center">
        <p class="tabular-nums text-2xl font-bold text-accent">{{ item.value.toLocaleString('en-US') }}</p>
        <p class="mt-1 text-xs font-medium text-ink-mid">{{ item.label }}</p>
      </div>
    </div>
  </div>
</template>
