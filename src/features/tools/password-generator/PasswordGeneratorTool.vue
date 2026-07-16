<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Copy, Check, RefreshCw } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'

const length = ref(16)
const options = reactive({
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
})
const password = ref('')
const copied = ref(false)

type OptionKey = keyof typeof options

const OPTION_LABELS: { key: OptionKey; label: string }[] = [
  { key: 'upper', label: 'Uppercase (A-Z)' },
  { key: 'lower', label: 'Lowercase (a-z)' },
  { key: 'digits', label: 'Digits (0-9)' },
  { key: 'symbols', label: 'Symbols' },
]

// Ambiguous characters (I, l, O, 0, 1) removed for readability.
const SETS: Record<OptionKey, string> = {
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghijkmnopqrstuvwxyz',
  digits: '23456789',
  symbols: '!@#$%^&*()-_=+[]{}<>?',
}

function toggle(key: OptionKey) {
  options[key] = !options[key]
  // Never allow zero character sets.
  if (!Object.values(options).some(Boolean)) options.lower = true
  generate()
}

function generate() {
  const pools = OPTION_LABELS.filter((o) => options[o.key]).map((o) => SETS[o.key])
  const all = pools.join('')
  const bytes = new Uint32Array(length.value)
  crypto.getRandomValues(bytes)

  // Guarantee at least one char from each selected set, fill the rest randomly.
  const chars: string[] = pools.map((pool, i) => pool[bytes[i]! % pool.length]!)
  for (let i = pools.length; i < length.value; i++) {
    chars.push(all[bytes[i]! % all.length]!)
  }
  // Fisher–Yates shuffle with fresh randomness
  const shuffle = new Uint32Array(chars.length)
  crypto.getRandomValues(shuffle)
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffle[i]! % (i + 1)
    ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
  }
  password.value = chars.join('')
  copied.value = false
}

const strength = computed(() => {
  let poolSize = 0
  if (options.upper) poolSize += 26
  if (options.lower) poolSize += 26
  if (options.digits) poolSize += 10
  if (options.symbols) poolSize += 21
  const entropy = length.value * Math.log2(Math.max(poolSize, 1))
  if (entropy >= 90) return { label: 'Very strong', percent: 100, tone: 'bg-success' }
  if (entropy >= 65) return { label: 'Strong', percent: 75, tone: 'bg-success' }
  if (entropy >= 45) return { label: 'Medium', percent: 50, tone: 'bg-warning' }
  return { label: 'Weak', percent: 25, tone: 'bg-danger' }
})

async function copy() {
  try {
    await navigator.clipboard.writeText(password.value)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* clipboard may be unavailable */
  }
}

onMounted(generate)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="surface p-5">
      <div class="flex items-center gap-3">
        <output class="min-w-0 flex-1 break-all rounded-sm border border-line bg-solid px-4 py-3 font-mono text-lg text-ink" aria-live="polite">
          {{ password }}
        </output>
        <button
          type="button"
          class="press flex size-11 shrink-0 items-center justify-center rounded-sm bg-accent-soft text-accent hover:bg-accent hover:text-on-accent"
          :aria-label="copied ? 'Copied' : 'Copy password'"
          @click="copy"
        >
          <Check v-if="copied" class="size-5" />
          <Copy v-else class="size-5" />
        </button>
      </div>
      <div class="mt-4">
        <div class="flex items-center justify-between text-sm">
          <span class="text-ink-mid">Strength</span>
          <span class="font-semibold text-ink">{{ strength.label }}</span>
        </div>
        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-(--border-subtle)">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="strength.tone"
            :style="{ width: `${strength.percent}%` }"
          />
        </div>
      </div>
    </div>

    <div class="surface flex flex-col gap-5 p-5">
      <div>
        <label for="pw-length" class="flex items-center justify-between text-sm font-medium text-ink">
          Length
          <span class="tabular-nums font-mono text-accent">{{ length }}</span>
        </label>
        <input
          id="pw-length"
          v-model.number="length"
          type="range"
          min="8"
          max="64"
          class="mt-2 w-full accent-(--accent-color)"
          @input="generate"
        />
      </div>

      <fieldset class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <legend class="sr-only">Character types</legend>
        <label
          v-for="opt in OPTION_LABELS"
          :key="opt.key"
          class="flex cursor-pointer items-center gap-2.5 rounded-sm border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent"
        >
          <input
            type="checkbox"
            class="size-4 accent-(--accent-color)"
            :checked="options[opt.key]"
            @change="toggle(opt.key)"
          />
          {{ opt.label }}
        </label>
      </fieldset>

      <UiButton @click="generate">
        <RefreshCw class="size-4" aria-hidden="true" />
        Generate new password
      </UiButton>
    </div>
  </div>
</template>
