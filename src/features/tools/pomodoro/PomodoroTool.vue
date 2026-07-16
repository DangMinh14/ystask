<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'

type Phase = 'focus' | 'shortBreak' | 'longBreak'

const DURATIONS: Record<Phase, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
}

const PHASE_LABELS: Record<Phase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
}

const phase = ref<Phase>('focus')
const secondsLeft = ref(DURATIONS.focus)
const running = ref(false)
const completedFocus = ref(0)
let timer: number | undefined

const minutes = computed(() => String(Math.floor(secondsLeft.value / 60)).padStart(2, '0'))
const seconds = computed(() => String(secondsLeft.value % 60).padStart(2, '0'))
const progress = computed(() => 1 - secondsLeft.value / DURATIONS[phase.value])

// SVG ring geometry
const R = 130
const CIRCUMFERENCE = 2 * Math.PI * R

function tick() {
  if (secondsLeft.value > 0) {
    secondsLeft.value--
    document.title = `${minutes.value}:${seconds.value} · ${PHASE_LABELS[phase.value]} · Ystask`
    return
  }
  // Phase finished → advance automatically.
  notify()
  if (phase.value === 'focus') {
    completedFocus.value++
    switchPhase(completedFocus.value % 4 === 0 ? 'longBreak' : 'shortBreak', true)
  } else {
    switchPhase('focus', true)
  }
}

function notify() {
  // Gentle beep via WebAudio; no external assets.
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.65)
  } catch {
    /* audio may be blocked */
  }
}

function switchPhase(next: Phase, keepRunning = false) {
  phase.value = next
  secondsLeft.value = DURATIONS[next]
  if (!keepRunning) stop()
}

function start() {
  if (running.value) return
  running.value = true
  timer = window.setInterval(tick, 1000)
}

function stop() {
  running.value = false
  if (timer) window.clearInterval(timer)
  timer = undefined
}

function resetPhase() {
  stop()
  secondsLeft.value = DURATIONS[phase.value]
  document.title = 'Pomodoro · Ystask'
}

onUnmounted(() => {
  stop()
  document.title = 'Ystask · Personal tools and productivity'
})
</script>

<template>
  <div class="surface flex flex-col items-center gap-6 p-6 sm:p-10">
    <!-- Phase switcher -->
    <div class="flex rounded-sm border border-line p-1" role="tablist" aria-label="Pomodoro mode">
      <button
        v-for="p in (['focus', 'shortBreak', 'longBreak'] as const)"
        :key="p"
        type="button"
        role="tab"
        :aria-selected="phase === p"
        class="rounded-sm px-4 py-1.5 text-sm font-semibold transition-colors"
        :class="phase === p ? 'bg-accent text-on-accent' : 'text-ink-mid hover:text-ink'"
        @click="switchPhase(p)"
      >
        {{ PHASE_LABELS[p] }}
      </button>
    </div>

    <!-- Timer ring -->
    <div class="relative">
      <svg :width="300" :height="300" viewBox="0 0 300 300" class="max-w-full -rotate-90">
        <circle cx="150" cy="150" :r="R" fill="none" stroke="var(--border-subtle)" stroke-width="10" />
        <circle
          cx="150"
          cy="150"
          :r="R"
          fill="none"
          stroke="var(--accent-color)"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="CIRCUMFERENCE * (1 - progress)"
          style="transition: stroke-dashoffset 0.9s linear"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <component :is="phase === 'focus' ? Brain : Coffee" class="size-6 text-accent" aria-hidden="true" />
        <p class="tabular-nums mt-1 font-mono text-6xl font-semibold text-ink" role="timer" aria-live="off">
          {{ minutes }}:{{ seconds }}
        </p>
        <p class="mt-1 text-sm text-ink-mid">{{ PHASE_LABELS[phase] }}</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <UiButton size="lg" @click="running ? stop() : start()">
        <Pause v-if="running" class="size-5" aria-hidden="true" />
        <Play v-else class="size-5" aria-hidden="true" />
        {{ running ? 'Pause' : 'Start' }}
      </UiButton>
      <UiButton size="lg" variant="ghost" @click="resetPhase">
        <RotateCcw class="size-5" aria-hidden="true" />
        Reset
      </UiButton>
    </div>

    <p class="text-sm text-ink-faint">
      Completed <span class="tabular-nums font-semibold text-accent">{{ completedFocus }}</span> focus sessions
      · long break after every 4 sessions
    </p>
  </div>
</template>
