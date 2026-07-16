<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy, Eraser } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'

type Mode = 'preserve-paragraphs' | 'all-with-space' | 'all'

const MODES: { id: Mode; label: string; hint: string }[] = [
  {
    id: 'preserve-paragraphs',
    label: 'Remove some line breaks',
    hint: 'Joins wrapped lines but keeps paragraphs (blank lines) separate.',
  },
  {
    id: 'all-with-space',
    label: 'Remove all line breaks, add a space between lines',
    hint: 'Everything becomes one block, with a space where each break was.',
  },
  {
    id: 'all',
    label: 'Remove all line breaks',
    hint: 'Everything becomes one block, lines glued together with nothing between.',
  },
]

const mode = ref<Mode>('preserve-paragraphs')
const input = ref('')
const output = ref('')
const copied = ref(false)

const stats = computed(() => {
  const lines = input.value ? input.value.split(/\r\n|\r|\n/).length : 0
  return { lines, chars: input.value.length }
})

function normalize(text: string): string {
  return text.replace(/\r\n|\r/g, '\n')
}

function convert() {
  const text = normalize(input.value)
  if (mode.value === 'preserve-paragraphs') {
    output.value = text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.replace(/\n+/g, ' ').replace(/ {2,}/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n')
  } else if (mode.value === 'all-with-space') {
    output.value = text.replace(/\n+/g, ' ').replace(/ {2,}/g, ' ').trim()
  } else {
    output.value = text.replace(/\n+/g, '').trim()
  }
  copied.value = false
}

async function copyOutput() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    /* clipboard unavailable */
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  copied.value = false
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <fieldset class="surface flex flex-col gap-3 p-5">
      <legend class="sr-only">Line break options</legend>
      <p class="text-sm font-bold uppercase tracking-wide text-ink">Choose an option</p>
      <label
        v-for="option in MODES"
        :key="option.id"
        class="flex cursor-pointer items-start gap-3 rounded-sm border-2 p-3.5 transition-colors"
        :class="mode === option.id ? 'border-line-strong bg-accent-soft' : 'border-line hover:border-line-strong'"
      >
        <input
          v-model="mode"
          type="radio"
          name="line-break-mode"
          :value="option.id"
          class="mt-1 size-4 accent-(--accent-color)"
        />
        <span>
          <span class="block text-sm font-semibold text-ink">{{ option.label }}</span>
          <span class="mt-0.5 block text-sm text-ink-mid">{{ option.hint }}</span>
        </span>
      </label>
    </fieldset>

    <div class="surface flex flex-col gap-3 p-5">
      <label for="lbr-input" class="text-sm font-semibold text-ink">Paste your text</label>
      <textarea
        id="lbr-input"
        v-model="input"
        rows="8"
        class="w-full resize-y rounded-sm border-2 border-line-strong bg-solid p-3.5 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:border-(--accent-color)"
        placeholder="Text with
line breaks
goes here."
      />
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="tabular-nums text-sm text-ink-faint">{{ stats.lines }} lines, {{ stats.chars.toLocaleString('en-US') }} characters</p>
        <div class="flex gap-2">
          <UiButton variant="ghost" :disabled="!input" @click="clearAll">
            <Eraser class="size-4" aria-hidden="true" />
            Clear
          </UiButton>
          <UiButton :disabled="!input" @click="convert">Remove line breaks</UiButton>
        </div>
      </div>
    </div>

    <div v-if="output" class="surface flex flex-col gap-3 p-5">
      <div class="flex items-center justify-between gap-3">
        <label for="lbr-output" class="text-sm font-semibold text-ink">Result</label>
        <UiButton size="sm" variant="secondary" @click="copyOutput">
          <component :is="copied ? Check : Copy" class="size-4" aria-hidden="true" />
          {{ copied ? 'Copied' : 'Copy result' }}
        </UiButton>
      </div>
      <textarea
        id="lbr-output"
        :value="output"
        readonly
        rows="8"
        class="w-full resize-y rounded-sm border-2 border-line-strong bg-accent-soft p-3.5 font-mono text-sm leading-relaxed text-ink"
      />
    </div>
  </div>
</template>
