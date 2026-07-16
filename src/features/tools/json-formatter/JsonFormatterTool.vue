<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Check, Braces, Minimize2 } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'

const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)

function process(minify: boolean) {
  error.value = ''
  output.value = ''
  if (!input.value.trim()) return
  try {
    const parsed = JSON.parse(input.value)
    output.value = JSON.stringify(parsed, null, minify ? 0 : 2)
  } catch (e) {
    error.value = e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : 'Invalid JSON.'
  }
}

async function copy() {
  if (!output.value) return
  try {
    await navigator.clipboard.writeText(output.value)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* clipboard may be unavailable */
  }
}
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="surface flex flex-col gap-3 p-5">
      <label for="json-input" class="text-sm font-medium text-ink">JSON input</label>
      <textarea
        id="json-input"
        v-model="input"
        rows="14"
        spellcheck="false"
        placeholder='{"name": "Ystask"}'
        class="w-full flex-1 resize-y rounded-sm border border-line-strong bg-solid p-3.5 font-mono text-sm text-ink placeholder:text-ink-faint focus:border-accent"
      />
      <p v-if="error" role="alert" class="rounded-sm bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
        {{ error }}
      </p>
      <div class="flex gap-2">
        <UiButton size="sm" @click="process(false)">
          <Braces class="size-4" aria-hidden="true" />
          Format
        </UiButton>
        <UiButton size="sm" variant="secondary" @click="process(true)">
          <Minimize2 class="size-4" aria-hidden="true" />
          Minify
        </UiButton>
      </div>
    </div>

    <div class="surface flex flex-col gap-3 p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-ink">Result</span>
        <button
          v-if="output"
          type="button"
          class="press inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-strong"
          @click="copy"
        >
          <Check v-if="copied" class="size-4" aria-hidden="true" />
          <Copy v-else class="size-4" aria-hidden="true" />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
      <pre
        class="min-h-80 flex-1 overflow-auto rounded-sm border border-line bg-solid p-3.5 font-mono text-sm text-ink"
      >{{ output || 'The result will appear here.' }}</pre>
    </div>
  </div>
</template>
