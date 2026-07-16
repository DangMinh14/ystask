<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'
import UiStat from '../../../components/ui/UiStat.vue'

type Language = 'english' | 'vietnamese'

const ENGLISH_WORDS = [
  'the', 'be', 'of', 'and', 'have', 'that', 'for', 'you', 'with', 'say',
  'this', 'they', 'but', 'his', 'from', 'not', 'she', 'as', 'what', 'their',
  'can', 'who', 'get', 'would', 'her', 'all', 'make', 'about', 'know', 'will',
  'time', 'there', 'year', 'think', 'when', 'which', 'them', 'some', 'people',
  'take', 'out', 'into', 'just', 'see', 'him', 'your', 'come', 'could', 'now',
  'than', 'like', 'other', 'how', 'then', 'its', 'our', 'two', 'more', 'these',
  'want', 'way', 'look', 'first', 'also', 'new', 'because', 'day', 'use', 'no',
  'man', 'find', 'here', 'thing', 'give', 'many', 'well', 'only', 'those',
  'tell', 'very', 'even', 'back', 'any', 'good', 'woman', 'through', 'life',
  'child', 'work', 'down', 'may', 'after', 'should', 'call', 'world', 'over',
  'school', 'still', 'try', 'last', 'ask', 'need', 'too', 'feel', 'three',
  'state', 'never', 'become', 'between', 'high', 'really', 'something', 'most',
]

// Common Vietnamese words; type them with your usual input method (Telex, VNI).
const VIETNAMESE_WORDS = [
  'và', 'của', 'có', 'là', 'được', 'trong', 'cho', 'không', 'người', 'với',
  'này', 'những', 'một', 'các', 'đã', 'khi', 'đến', 'về', 'như', 'cũng',
  'nhiều', 'thì', 'sẽ', 'phải', 'năm', 'ra', 'nếu', 'từ', 'việc', 'làm',
  'nói', 'ngày', 'lại', 'nhà', 'đi', 'hơn', 'sau', 'trên', 'con', 'nước',
  'rất', 'vào', 'còn', 'nên', 'thời', 'gian', 'biết', 'mới', 'chỉ', 'học',
  'trước', 'giờ', 'tôi', 'bạn', 'chúng', 'ta', 'ai', 'gì', 'đâu', 'sao',
  'thế', 'nào', 'vì', 'do', 'bởi', 'tại', 'theo', 'cùng', 'giữa', 'ngoài',
  'trời', 'đất', 'sáng', 'chiều', 'tối', 'đêm', 'tuần', 'tháng', 'mùa', 'xuân',
  'hè', 'thu', 'đông', 'mưa', 'nắng', 'gió', 'sông', 'núi', 'biển', 'rừng',
  'ăn', 'uống', 'ngủ', 'chơi', 'đọc', 'viết', 'nghe', 'nhìn', 'yêu', 'thích',
  'vui', 'buồn', 'đẹp', 'xấu', 'lớn', 'nhỏ', 'cao', 'thấp', 'nhanh', 'chậm',
]

const DURATION = 60
const WORD_COUNT = 160

const language = ref<Language>('english')
const words = ref<string[]>([])
const results = ref<boolean[]>([]) // per committed word
const currentIndex = ref(0)
const currentInput = ref('')
const secondsLeft = ref(DURATION)
const state = ref<'idle' | 'running' | 'finished'>('idle')
const inputEl = ref<HTMLInputElement | null>(null)

let timer = 0
let startedAt = 0

function pickWords(): string[] {
  const source = language.value === 'english' ? ENGLISH_WORDS : VIETNAMESE_WORDS
  const buf = new Uint32Array(WORD_COUNT)
  crypto.getRandomValues(buf)
  const out: string[] = []
  for (let i = 0; i < WORD_COUNT; i++) {
    let word = source[buf[i]! % source.length]!
    // Avoid immediate repeats so the stream reads naturally.
    if (word === out.at(-1)) word = source[(buf[i]! + 1) % source.length]!
    out.push(word)
  }
  return out
}

function setup() {
  clearInterval(timer)
  words.value = pickWords()
  results.value = []
  currentIndex.value = 0
  currentInput.value = ''
  secondsLeft.value = DURATION
  state.value = 'idle'
  nextTick(() => inputEl.value?.focus())
}

function setLanguage(next: Language) {
  language.value = next
  setup()
}

function start() {
  if (state.value !== 'idle') return
  state.value = 'running'
  startedAt = Date.now()
  timer = window.setInterval(() => {
    // Derive from wall clock so throttled tabs still end on time.
    const elapsed = Math.floor((Date.now() - startedAt) / 1000)
    secondsLeft.value = Math.max(0, DURATION - elapsed)
    if (secondsLeft.value === 0) finish()
  }, 250)
}

function finish() {
  clearInterval(timer)
  state.value = 'finished'
}

function onInput() {
  if (state.value === 'idle' && currentInput.value.length > 0) start()
  if (state.value === 'finished') return

  // A space commits the current word.
  if (currentInput.value.endsWith(' ')) {
    const typed = currentInput.value.trim()
    if (typed.length > 0) {
      results.value.push(typed === words.value[currentIndex.value])
      currentIndex.value++
      currentInput.value = ''
      if (currentIndex.value >= words.value.length) finish()
    } else {
      currentInput.value = ''
    }
  }
}

const correctCount = computed(() => results.value.filter(Boolean).length)

const accuracy = computed(() => {
  if (results.value.length === 0) return null
  return Math.round((correctCount.value / results.value.length) * 100)
})

const wpm = computed(() => {
  const elapsed = state.value === 'finished' ? DURATION - secondsLeft.value || DURATION : DURATION - secondsLeft.value
  if (elapsed <= 0) return null
  // Standard net WPM: correct words scaled to a full minute.
  return Math.round((correctCount.value / elapsed) * 60)
})

/** Window of words around the cursor so the panel stays compact. */
const visibleWindow = computed(() => {
  const from = Math.max(0, currentIndex.value - 6)
  return words.value.slice(from, from + 32).map((word, i) => {
    const index = from + i
    return {
      word,
      index,
      status:
        index === currentIndex.value
          ? 'current'
          : index < currentIndex.value
            ? results.value[index]
              ? 'correct'
              : 'wrong'
            : 'upcoming',
    }
  })
})

const currentMismatch = computed(() => {
  const target = words.value[currentIndex.value]
  if (!target || !currentInput.value) return false
  return !target.startsWith(currentInput.value)
})

onBeforeUnmount(() => clearInterval(timer))
setup()
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Controls + live stats -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex gap-2" role="group" aria-label="Word language">
        <button
          v-for="option in (['english', 'vietnamese'] as const)"
          :key="option"
          type="button"
          class="press rounded-sm border-2 border-line-strong px-4 py-2 text-sm font-semibold"
          :class="language === option ? 'bg-accent text-on-accent shadow-button' : 'bg-solid text-ink-mid hover:bg-accent-soft'"
          :aria-pressed="language === option"
          :disabled="state === 'running'"
          @click="setLanguage(option)"
        >
          {{ option === 'english' ? 'English' : 'Tiếng Việt' }}
        </button>
      </div>
      <UiButton variant="ghost" @click="setup">
        <RotateCcw class="size-4" aria-hidden="true" />
        Restart
      </UiButton>
    </div>

    <div class="stagger grid gap-3 sm:grid-cols-3">
      <div class="surface p-4 text-center">
        <p class="text-eyebrow">Time left</p>
        <p class="tabular-nums mt-1 text-3xl font-bold" :class="secondsLeft <= 10 && state === 'running' ? 'text-danger' : 'text-ink'">
          {{ secondsLeft }}s
        </p>
      </div>
      <div class="surface p-4 text-center">
        <p class="text-eyebrow">WPM</p>
        <p class="tabular-nums mt-1 text-3xl font-bold text-ink">{{ state === 'idle' ? '-' : (wpm ?? '-') }}</p>
      </div>
      <div class="surface p-4 text-center">
        <p class="text-eyebrow">Accuracy</p>
        <p class="tabular-nums mt-1 text-3xl font-bold text-ink">{{ accuracy === null ? '-' : `${accuracy}%` }}</p>
      </div>
    </div>

    <!-- Word stream -->
    <div class="surface p-5" aria-label="Words to type">
      <p class="flex flex-wrap gap-x-2 gap-y-1.5 font-mono text-lg leading-relaxed">
        <span
          v-for="item in visibleWindow"
          :key="item.index"
          class="rounded-xs px-1"
          :class="{
            'bg-accent text-on-accent': item.status === 'current' && !currentMismatch,
            'bg-danger-soft text-danger': item.status === 'current' && currentMismatch,
            'text-success line-through decoration-transparent': item.status === 'correct',
            'text-danger line-through': item.status === 'wrong',
            'text-ink-mid': item.status === 'upcoming',
          }"
        >{{ item.word }}</span>
      </p>
    </div>

    <!-- Input -->
    <div v-if="state !== 'finished'" class="flex flex-col gap-1.5">
      <label for="typing-input" class="text-sm font-semibold text-ink">
        Type here, press space after each word
        <span v-if="state === 'idle'" class="font-normal text-ink-faint">(the 60 second timer starts with your first key)</span>
      </label>
      <input
        id="typing-input"
        ref="inputEl"
        v-model="currentInput"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        class="h-13 w-full rounded-sm border-2 bg-solid px-4 font-mono text-lg text-ink transition-colors"
        :class="currentMismatch ? 'border-(--color-danger)' : 'border-line-strong focus:border-(--accent-color)'"
        @input="onInput"
      />
    </div>

    <!-- Results -->
    <div v-else class="surface p-6" role="status" aria-live="polite">
      <h2 class="text-lg font-bold text-ink">Time is up</h2>
      <div class="stagger mt-4 grid gap-3 sm:grid-cols-3">
        <UiStat label="Words per minute" :count="wpm ?? 0" />
        <UiStat label="Accuracy" :value="accuracy === null ? '-' : `${accuracy}%`" />
        <UiStat label="Words typed" :value="`${correctCount} correct / ${results.length}`" />
      </div>
      <UiButton class="mt-5" @click="setup">
        <RotateCcw class="size-4" aria-hidden="true" />
        Try again
      </UiButton>
    </div>
  </div>
</template>
