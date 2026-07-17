<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowDownAZ,
  History,
  PartyPopper,
  Play,
  RotateCcw,
  Shuffle,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'
import UiModal from '../../../components/ui/UiModal.vue'

const rawInput = ref('Pizza\nBurger\nSushi\nTacos\nFried chicken\nPasta')
const canvas = ref<HTMLCanvasElement | null>(null)
const confettiCanvas = ref<HTMLCanvasElement | null>(null)
const spinning = ref(false)
const winner = ref('')
const winnerColor = ref('')
const resultOpen = ref(false)
const rotation = ref(0)
const soundOn = ref(true)

const SIZE = 440

/* Color themes. Each is a fixed palette; "rainbow" is generated per-slice (RGB). */
interface Theme {
  id: string
  label: string
  colors?: string[]
  rainbow?: boolean
}
const THEMES: Theme[] = [
  { id: 'brutalist', label: 'Brutalist', colors: ['#ea580c', '#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2', '#c2410c'] },
  { id: 'candy', label: 'Candy', colors: ['#ff6b9d', '#feca57', '#48dbfb', '#1dd1a1', '#ff9ff3', '#54a0ff', '#ff6348', '#5f27cd'] },
  { id: 'ocean', label: 'Ocean', colors: ['#0a4d68', '#088395', '#05bfdb', '#00ffca', '#146c94', '#19a7ce', '#1450a3', '#337ccf'] },
  { id: 'forest', label: 'Forest', colors: ['#1a4d2e', '#4f6f52', '#739072', '#86a789', '#2c6e49', '#4c956c', '#588157', '#3a5a40'] },
  { id: 'sunset', label: 'Sunset', colors: ['#ff5f6d', '#ffc371', '#f97316', '#ef4444', '#f59e0b', '#db2777', '#e11d48', '#f43f5e'] },
  { id: 'rainbow', label: 'Rainbow (RGB)', rainbow: true },
]
const themeId = ref('brutalist')
const activeTheme = computed(() => THEMES.find((t) => t.id === themeId.value) ?? THEMES[0]!)

/* Spin speed: more turns + shorter time = faster; fewer turns + longer time = slower. */
interface Speed {
  id: string
  label: string
  turns: number
  duration: number
}
const SPEEDS: Speed[] = [
  { id: 'slow', label: 'Slow', turns: 5, duration: 8500 },
  { id: 'normal', label: 'Normal', turns: 7, duration: 6000 },
  { id: 'fast', label: 'Fast', turns: 10, duration: 3600 },
]
const speedId = ref('normal')
const activeSpeed = computed(() => SPEEDS.find((s) => s.id === speedId.value) ?? SPEEDS[1]!)

/* Winner history, newest first. */
interface HistoryEntry {
  name: string
  color: string
  at: string
}
const history = ref<HistoryEntry[]>([])

const entries = computed(() =>
  rawInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24),
)

function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 100
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/* Resolve the color for slice i out of n for the active theme. */
function sliceColor(i: number, n: number): string {
  const theme = activeTheme.value
  if (theme.rainbow) return hslToHex((i / Math.max(n, 1)) * 360, 72, 55 / 100)
  const colors = theme.colors!
  return colors[i % colors.length]!
}

/* Relative luminance to decide black vs white label text. */
function readableText(hex: string): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.6 ? '#1c1917' : '#ffffff'
}

function draw() {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  const n = entries.value.length
  const center = SIZE / 2
  const radius = center - 6
  ctx.clearRect(0, 0, SIZE, SIZE)

  if (n === 0) {
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(128,128,128,0.15)'
    ctx.fill()
    return
  }

  const slice = (Math.PI * 2) / n
  for (let i = 0; i < n; i++) {
    const start = rotation.value + i * slice
    const fill = sliceColor(i, n)
    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.arc(center, center, radius, start, start + slice)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = '#1c1917'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(start + slice / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = readableText(fill)
    ctx.font = '600 13px "Space Grotesk", sans-serif'
    const label = entries.value[i]!.length > 16 ? `${entries.value[i]!.slice(0, 15)}…` : entries.value[i]!
    ctx.fillText(label, radius - 14, 5)
    ctx.restore()
  }

  // Outer ring
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, Math.PI * 2)
  ctx.strokeStyle = '#1c1917'
  ctx.lineWidth = 3
  ctx.stroke()

  // Hub ring (the actual button sits on top as a DOM element)
  ctx.beginPath()
  ctx.arc(center, center, 40, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#1c1917'
  ctx.lineWidth = 2
  ctx.stroke()
}

/* ---- Sound effects: WebAudio, no assets ---- */
let audioCtx: AudioContext | null = null
function getAudio(): AudioContext | null {
  if (!soundOn.value) return null
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function playTick() {
  const ctx = getAudio()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0.06, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05)
  osc.connect(gain).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.06)
}

function playFanfare() {
  const ctx = getAudio()
  if (!ctx) return
  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = ctx.currentTime + i * 0.09
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.14, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.45)
  })
}

/* Confetti: lightweight canvas burst, time-bounded, skipped for reduced motion. */
interface ConfettiPiece {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  w: number
  h: number
  color: string
  shape: 'rect' | 'circle'
}

let confettiPieces: ConfettiPiece[] = []
let confettiRaf = 0
let confettiUntil = 0

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const el = confettiCanvas.value
  if (!el) return
  el.width = window.innerWidth
  el.height = window.innerHeight

  const n = entries.value.length
  const palette = Array.from({ length: Math.max(n, 6) }, (_, i) => sliceColor(i, Math.max(n, 6)))
  const originX = el.width / 2
  const originY = el.height * 0.35
  confettiPieces = Array.from({ length: 140 }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 5 + Math.random() * 11
    return {
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.35,
      w: 6 + Math.random() * 7,
      h: 4 + Math.random() * 6,
      color: palette[Math.floor(Math.random() * palette.length)]!,
      shape: Math.random() > 0.5 ? 'rect' : 'circle',
    }
  })
  confettiUntil = performance.now() + 2600
  cancelAnimationFrame(confettiRaf)
  confettiRaf = requestAnimationFrame(confettiFrame)
}

function confettiFrame(now: number) {
  const el = confettiCanvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, el.width, el.height)

  if (now > confettiUntil) {
    confettiPieces = []
    return
  }

  const fade = Math.min(1, (confettiUntil - now) / 600)
  for (const p of confettiPieces) {
    p.vy += 0.22
    p.vx *= 0.99
    p.x += p.vx
    p.y += p.vy
    p.angle += p.spin
    ctx.save()
    ctx.globalAlpha = fade
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)
    ctx.fillStyle = p.color
    if (p.shape === 'rect') {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  confettiRaf = requestAnimationFrame(confettiFrame)
}

const TWO_PI = Math.PI * 2
/* Which slice sits under the top pointer (-PI/2) for a given wheel rotation. */
function sliceUnderPointer(rot: number, n: number): number {
  const slice = TWO_PI / n
  return Math.floor(((((-Math.PI / 2 - rot) % TWO_PI) + TWO_PI) % TWO_PI) / slice) % n
}

function spin() {
  const n = entries.value.length
  if (spinning.value || n < 2) return
  getAudio() // unlock audio inside the user gesture
  spinning.value = true
  winner.value = ''

  // Pick the winner with crypto randomness, then land the pointer at a random
  // spot *inside* that slice (inner 76%, never dead-center) so the stop looks
  // physical instead of always snapping to the middle.
  const buf = new Uint32Array(2)
  crypto.getRandomValues(buf)
  const winIndex = buf[0]! % n

  const slice = TWO_PI / n
  const offset = slice * 0.12 + (buf[1]! / 0xffffffff) * slice * 0.76
  // Pointer at -PI/2 should sit at `offset` into the winning slice.
  const targetAngle = -Math.PI / 2 - (winIndex * slice + offset)
  const current = rotation.value % TWO_PI
  const spins = activeSpeed.value.turns * TWO_PI
  const delta = spins + (((targetAngle - current) % TWO_PI) + TWO_PI) % TWO_PI
  const startRotation = rotation.value
  const duration = activeSpeed.value.duration
  const startTime = performance.now()
  let lastTickSlice = -1

  function frame(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    // Slow -> fast -> slow, with a long sextic tail so the final stop drags out
    // for tension before it settles.
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 6) / 2
    rotation.value = startRotation + delta * eased
    draw()

    // Tick when a new slice crosses the pointer (ticks naturally space out as it slows).
    const pointerSlice = sliceUnderPointer(rotation.value, n)
    if (pointerSlice !== lastTickSlice) {
      lastTickSlice = pointerSlice
      playTick()
    }

    if (t < 1) {
      requestAnimationFrame(frame)
    } else {
      spinning.value = false
      // Read the result from where the pointer actually landed.
      const landed = sliceUnderPointer(rotation.value, n)
      winner.value = entries.value[landed]!
      winnerColor.value = sliceColor(landed, n)
      resultOpen.value = true
      history.value.unshift({
        name: winner.value,
        color: winnerColor.value,
        at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
      history.value = history.value.slice(0, 30)
      launchConfetti()
      playFanfare()
    }
  }
  requestAnimationFrame(frame)
}

function spinAgain() {
  resultOpen.value = false
  spin()
}

function removeWinner() {
  if (!winner.value) return
  rawInput.value = entries.value.filter((e) => e !== winner.value).join('\n')
  winner.value = ''
  resultOpen.value = false
}

function reset() {
  winner.value = ''
  resultOpen.value = false
  rotation.value = 0
  draw()
}

function sortEntries() {
  if (spinning.value) return
  rawInput.value = [...entries.value].sort((a, b) => a.localeCompare(b)).join('\n')
}

function shuffleEntries() {
  if (spinning.value) return
  const arr = [...entries.value]
  for (let i = arr.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const j = buf[0]! % (i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  rawInput.value = arr.join('\n')
}

function clearHistory() {
  history.value = []
}

watch(entries, draw)
watch(themeId, draw)
onMounted(draw)
onBeforeUnmount(() => {
  cancelAnimationFrame(confettiRaf)
  audioCtx?.close().catch(() => {})
})
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
    <!-- Wheel: the large, centered focal point -->
    <div class="surface flex flex-col items-center justify-center gap-5 p-6 lg:p-8">
      <div class="relative w-full max-w-[min(100%,520px)]">
        <!-- Pointer -->
        <div
          class="absolute -top-1.5 left-1/2 z-10 -translate-x-1/2"
          aria-hidden="true"
          style="width: 0; height: 0; border-left: 15px solid transparent; border-right: 15px solid transparent; border-top: 26px solid var(--accent-color)"
        />
        <canvas ref="canvas" :width="SIZE" :height="SIZE" class="mx-auto block h-auto w-full max-w-full" role="img" aria-label="Spin wheel" />

        <!-- Center hub button: click to spin. Centering lives on the wrapper so the
             button's own hover/press transforms never fight the -50% offset. -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            class="hub pointer-events-auto flex size-20 flex-col items-center justify-center rounded-full border-2 border-line-strong bg-accent text-on-accent font-bold shadow-button disabled:opacity-50 disabled:pointer-events-none"
            :disabled="entries.length < 2 || spinning"
            :aria-label="spinning ? 'Spinning' : 'Spin the wheel'"
            @click="spin"
          >
            <Play class="size-6" aria-hidden="true" :class="{ 'animate-pulse': spinning }" />
            <span class="text-xs leading-none">{{ spinning ? '…' : 'SPIN' }}</span>
          </button>
        </div>
      </div>

      <p class="text-sm text-ink-faint">Click the center of the wheel to spin.</p>

      <div class="flex w-full flex-wrap justify-center gap-2">
        <UiButton :disabled="entries.length < 2" :loading="spinning" @click="spin">
          <Play v-if="!spinning" class="size-4" aria-hidden="true" />
          {{ spinning ? 'Spinning…' : 'Spin' }}
        </UiButton>
        <UiButton v-if="winner" variant="secondary" @click="removeWinner">
          <Trash2 class="size-4" aria-hidden="true" />
          Remove this result
        </UiButton>
        <UiButton variant="ghost" :disabled="spinning" @click="reset">
          <RotateCcw class="size-4" aria-hidden="true" />
          Reset
        </UiButton>
      </div>
    </div>

    <!-- Right column: options, theme, history -->
    <div class="flex flex-col gap-6">
      <div class="surface flex flex-col gap-3 p-5">
        <label for="wheel-input" class="text-sm font-medium text-ink">
          Options list <span class="font-normal text-ink-faint">(one item per line, up to 24)</span>
        </label>
        <textarea
          id="wheel-input"
          v-model="rawInput"
          rows="8"
          :disabled="spinning"
          class="w-full flex-1 resize-y rounded-sm border-2 border-line-strong bg-solid p-3.5 text-base text-ink placeholder:text-ink-faint focus:border-accent disabled:opacity-60"
          placeholder="Pizza&#10;Burger&#10;Sushi…"
        />
        <div class="flex flex-wrap items-center gap-2">
          <p class="mr-auto text-sm text-ink-faint">{{ entries.length }} options</p>
          <UiButton variant="secondary" size="sm" :disabled="spinning || entries.length < 2" @click="sortEntries">
            <ArrowDownAZ class="size-4" aria-hidden="true" />
            Sort
          </UiButton>
          <UiButton variant="secondary" size="sm" :disabled="spinning || entries.length < 2" @click="shuffleEntries">
            <Shuffle class="size-4" aria-hidden="true" />
            Shuffle
          </UiButton>
        </div>
      </div>

      <!-- Theme + sound controls -->
      <div class="surface flex flex-col gap-3 p-5">
        <div class="flex items-center justify-between gap-3">
          <label class="text-sm font-medium text-ink">Wheel color</label>
          <button
            type="button"
            class="press flex items-center gap-1.5 rounded-sm border-2 border-line-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-accent-soft"
            :aria-pressed="soundOn"
            @click="soundOn = !soundOn"
          >
            <Volume2 v-if="soundOn" class="size-4" aria-hidden="true" />
            <VolumeX v-else class="size-4" aria-hidden="true" />
            {{ soundOn ? 'Sound on' : 'Sound off' }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in THEMES"
            :key="t.id"
            type="button"
            class="press flex items-center gap-2 rounded-sm border-2 px-3 py-1.5 text-sm font-medium"
            :class="themeId === t.id ? 'border-line-strong bg-accent-soft text-ink shadow-button' : 'border-line-subtle text-ink-mid hover:border-line-strong'"
            @click="themeId = t.id"
          >
            <span class="flex overflow-hidden rounded-xs border border-line-strong">
              <span
                v-for="(c, i) in (t.rainbow
                  ? ['#ff0000', '#ff9900', '#33cc33', '#0099ff', '#8833ff']
                  : t.colors!.slice(0, 5))"
                :key="i"
                class="size-3"
                :style="{ background: c }"
              />
            </span>
            {{ t.label }}
          </button>
        </div>

        <label class="mt-1 text-sm font-medium text-ink">Spin speed</label>
        <div class="flex overflow-hidden rounded-sm border-2 border-line-strong">
          <button
            v-for="(s, i) in SPEEDS"
            :key="s.id"
            type="button"
            class="press flex-1 px-3 py-2 text-sm font-medium"
            :class="[
              speedId === s.id ? 'bg-accent text-on-accent' : 'bg-solid text-ink-mid hover:bg-accent-soft',
              i > 0 ? 'border-l-2 border-line-strong' : '',
            ]"
            :aria-pressed="speedId === s.id"
            @click="speedId = s.id"
          >
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Winner history -->
      <div class="surface flex flex-col gap-2 p-5">
        <div class="flex items-center justify-between gap-2">
          <p class="flex items-center gap-1.5 text-sm font-medium text-ink">
            <History class="size-4" aria-hidden="true" />
            History
          </p>
          <button
            v-if="history.length"
            type="button"
            class="text-sm text-ink-faint underline-offset-2 hover:text-ink hover:underline"
            @click="clearHistory"
          >
            Clear
          </button>
        </div>
        <p v-if="!history.length" class="text-sm text-ink-faint">No spins yet.</p>
        <ol v-else class="flex max-h-48 flex-col gap-1 overflow-y-auto">
          <li
            v-for="(h, i) in history"
            :key="i"
            class="flex items-center gap-2.5 rounded-sm border-2 border-line-subtle px-3 py-1.5 text-sm"
          >
            <span class="size-3.5 shrink-0 rounded-xs border border-line-strong" :style="{ background: h.color }" />
            <span class="min-w-0 flex-1 truncate font-medium text-ink">{{ h.name }}</span>
            <span class="shrink-0 text-xs text-ink-faint">{{ h.at }}</span>
          </li>
        </ol>
      </div>
    </div>

    <!-- Winner modal -->
    <UiModal :open="resultOpen" title="We have a winner" size="sm" @close="resultOpen = false">
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <div
          class="sticker flex size-14 items-center justify-center rounded-sm border-2 border-line-strong shadow-button"
          :style="{ background: winnerColor, color: readableText(winnerColor || '#ea580c') }"
        >
          <PartyPopper class="size-7" aria-hidden="true" />
        </div>
        <!-- Winner name on a chip tinted to the slice color it landed on, so the
             color reads clearly while text contrast stays guaranteed. -->
        <span
          class="winner-pop inline-flex max-w-full items-center gap-2 rounded-sm border-2 border-line-strong px-4 py-2 shadow-button"
          :style="{ background: winnerColor, color: readableText(winnerColor || '#ea580c') }"
          aria-live="assertive"
        >
          <span class="break-words text-3xl font-bold leading-tight">{{ winner }}</span>
        </span>
        <p class="text-sm text-ink-mid">The wheel has spoken.</p>
      </div>
      <template #footer>
        <div class="flex flex-col gap-3">
          <div class="flex gap-2">
            <UiButton variant="secondary" block class="whitespace-nowrap" @click="resultOpen = false">Close</UiButton>
            <UiButton :disabled="entries.length < 2" block class="whitespace-nowrap" @click="spinAgain">
              <Play class="size-4" aria-hidden="true" />
              Spin again
            </UiButton>
          </div>
          <UiButton variant="danger" block class="whitespace-nowrap" @click="removeWinner">
            <Trash2 class="size-4" aria-hidden="true" />
            Remove option
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Confetti overlay -->
    <Teleport to="body">
      <canvas
        ref="confettiCanvas"
        class="pointer-events-none fixed inset-0 z-2100"
        aria-hidden="true"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.hub {
  transition: transform var(--motion-fast) var(--ease-standard);
}
.hub:not(:disabled):hover {
  transform: scale(1.06);
}
.hub:not(:disabled):active {
  transform: scale(0.96);
}
.winner-pop {
  animation: winner-pop 0.45s var(--ease-snap) both;
}
@keyframes winner-pop {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  70% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .winner-pop {
    animation: none;
  }
}
</style>
