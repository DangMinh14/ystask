import { onMounted, ref, watch, type Ref } from 'vue'

/**
 * Animates a number from 0 (or the previous value) to the target with
 * requestAnimationFrame. Respects prefers-reduced-motion by jumping straight
 * to the target.
 */
export function useCountUp(target: Ref<number>, durationMs = 700): Ref<number> {
  const display = ref(0)
  let raf = 0
  let fallback = 0

  function animate(from: number, to: number) {
    cancelAnimationFrame(raf)
    window.clearTimeout(fallback)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) {
      display.value = to
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      display.value = from + (to - from) * eased
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Background tabs throttle rAF; make sure the final value always lands.
    fallback = window.setTimeout(() => {
      cancelAnimationFrame(raf)
      display.value = to
    }, durationMs + 200)
  }

  onMounted(() => animate(0, target.value))
  watch(target, (to, from) => animate(from, to))

  return display
}
