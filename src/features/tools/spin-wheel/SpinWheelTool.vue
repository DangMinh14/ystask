<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PartyPopper, Play, RotateCcw, Trash2 } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'
import UiModal from '../../../components/ui/UiModal.vue'

const rawInput = ref('Pizza\nBurger\nSushi\nTacos\nFried chicken\nPasta')
const canvas = ref<HTMLCanvasElement | null>(null)
const confettiCanvas = ref<HTMLCanvasElement | null>(null)
const spinning = ref(false)
const winner = ref('')
const resultOpen = ref(false)
const rotation = ref(0)

const SIZE = 320
const COLORS = ['#ea580c', '#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2', '#c2410c']

const entries = computed(() =>
  rawInput.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24),
)

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
    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.arc(center, center, radius, start, start + slice)
    ctx.closePath()
    ctx.fillStyle = COLORS[i % COLORS.length]!
    ctx.fill()
    ctx.strokeStyle = '#1c1917'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.save()
    ctx.translate(center, center)
    ctx.rotate(start + slice / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#ffffff'
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

  // Hub
  ctx.beginPath()
  ctx.arc(center, center, 26, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = '#1c1917'
  ctx.lineWidth = 2
  ctx.stroke()
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
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
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

function spin() {
  const n = entries.value.length
  if (spinning.value || n < 2) return
  spinning.value = true
  winner.value = ''

  // Pick the winning index with crypto randomness, then animate to it.
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  const winIndex = buf[0]! % n

  const slice = (Math.PI * 2) / n
  // The pointer sits at angle -PI/2 (top). Land the middle of the winning slice under it.
  const targetAngle = -Math.PI / 2 - (winIndex * slice + slice / 2)
  const current = rotation.value % (Math.PI * 2)
  const spins = 6 * Math.PI * 2 // 6 full turns
  const delta = spins + ((targetAngle - current) % (Math.PI * 2))
  const startRotation = rotation.value
  const duration = 4200
  const startTime = performance.now()

  function frame(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    // ease-out quart
    const eased = 1 - Math.pow(1 - t, 4)
    rotation.value = startRotation + delta * eased
    draw()
    if (t < 1) {
      requestAnimationFrame(frame)
    } else {
      spinning.value = false
      winner.value = entries.value[winIndex]!
      resultOpen.value = true
      launchConfetti()
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

watch(entries, draw)
onMounted(draw)
onBeforeUnmount(() => cancelAnimationFrame(confettiRaf))
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="surface flex flex-col gap-3 p-5">
      <label for="wheel-input" class="text-sm font-medium text-ink">
        Options list <span class="font-normal text-ink-faint">(one item per line, up to 24)</span>
      </label>
      <textarea
        id="wheel-input"
        v-model="rawInput"
        rows="10"
        :disabled="spinning"
        class="w-full flex-1 resize-y rounded-sm border-2 border-line-strong bg-solid p-3.5 text-base text-ink placeholder:text-ink-faint focus:border-accent disabled:opacity-60"
        placeholder="Pizza&#10;Burger&#10;Sushi…"
      />
      <p class="text-sm text-ink-faint">{{ entries.length }} options</p>
    </div>

    <div class="surface flex flex-col items-center gap-5 p-6">
      <div class="relative">
        <!-- Pointer -->
        <div
          class="absolute -top-1 left-1/2 z-10 -translate-x-1/2"
          aria-hidden="true"
          style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 20px solid var(--accent-color)"
        />
        <canvas ref="canvas" :width="SIZE" :height="SIZE" class="max-w-full" role="img" aria-label="Spin wheel" />
      </div>

      <div v-if="winner && !resultOpen" class="w-full rounded-sm border-2 border-line-strong bg-accent-soft px-4 py-3 text-center" role="status" aria-live="assertive">
        <p class="text-sm text-ink-mid">Result</p>
        <p class="text-xl font-bold text-accent-strong">{{ winner }}</p>
      </div>

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

    <!-- Winner modal -->
    <UiModal :open="resultOpen" title="We have a winner" size="sm" @close="resultOpen = false">
      <div class="flex flex-col items-center gap-4 py-2 text-center">
        <div class="sticker flex size-14 items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong shadow-button">
          <PartyPopper class="size-7" aria-hidden="true" />
        </div>
        <p class="winner-pop max-w-full break-words text-3xl font-bold text-ink" aria-live="assertive">
          {{ winner }}
        </p>
        <p class="text-sm text-ink-mid">The wheel has spoken.</p>
      </div>
      <template #footer>
        <div class="flex flex-wrap justify-end gap-2">
          <UiButton variant="ghost" @click="removeWinner">
            <Trash2 class="size-4" aria-hidden="true" />
            Remove option
          </UiButton>
          <UiButton variant="secondary" @click="resultOpen = false">Close</UiButton>
          <UiButton :disabled="entries.length < 2" @click="spinAgain">
            <Play class="size-4" aria-hidden="true" />
            Spin again
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
