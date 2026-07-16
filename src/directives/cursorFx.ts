import type { Directive } from 'vue'

/**
 * Cursor micro-interactions for the neo-brutalist UI.
 *
 * Both directives are pointer-driven and elegant on purpose: small angles,
 * short springs, no global overlay. They stay out of the way on touch
 * devices and for anyone who prefers reduced motion, and they write straight
 * to the DOM inside a single rAF so Vue never re-renders per frame.
 *
 * Transforms are written with `important` because the affected cards live in
 * a `.stagger` container whose finished entrance animation otherwise keeps
 * ownership of the `transform` property.
 */

function pointerFine(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/* v-tilt: the panel leans toward the cursor in 3D, its hard offset shadow
   drifts the opposite way like a fixed light source, and any child marked
   [data-tilt-layer] floats a few pixels for depth. */

interface TiltOptions {
  max?: number
  scale?: number
  layerShift?: number
}

interface TiltHandlers {
  enter: () => void
  move: (e: PointerEvent) => void
  leave: () => void
}

const tiltStore = new WeakMap<HTMLElement, TiltHandlers>()

export const vTilt: Directive<HTMLElement, TiltOptions | undefined> = {
  mounted(el, binding) {
    if (!pointerFine()) return
    const opts = binding.value ?? {}
    const max = opts.max ?? 6
    const scale = opts.scale ?? 1.02
    const layerShift = opts.layerShift ?? 7
    const layer = el.querySelector<HTMLElement>('[data-tilt-layer]')

    let raf = 0
    let rect: DOMRect | null = null
    let nx = 0
    let ny = 0

    const render = () => {
      raf = 0
      const rx = (-ny * max).toFixed(2)
      const ry = (nx * max).toFixed(2)
      el.style.setProperty(
        'transform',
        `perspective(760px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(0,-3px,0) scale(${scale})`,
        'important',
      )
      const sx = (6 - nx * 4).toFixed(1)
      const sy = (6 - ny * 4).toFixed(1)
      el.style.setProperty('box-shadow', `${sx}px ${sy}px 0 0 var(--border-strong)`, 'important')
      if (layer) {
        layer.style.transform = `translate(${(nx * layerShift).toFixed(1)}px, ${(ny * layerShift).toFixed(1)}px)`
      }
    }

    const enter = () => {
      rect = el.getBoundingClientRect()
      el.style.transition = 'transform 130ms ease-out, box-shadow 130ms ease-out'
      if (layer) {
        layer.style.transition = 'transform 130ms ease-out, background-color 150ms ease, color 150ms ease'
      }
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!rect) rect = el.getBoundingClientRect()
      nx = (e.clientX - rect.left) / rect.width - 0.5
      ny = (e.clientY - rect.top) / rect.height - 0.5
      if (!raf) raf = requestAnimationFrame(render)
    }
    const leave = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      rect = null
      el.style.transition = 'transform 460ms var(--ease-out), box-shadow 460ms var(--ease-out)'
      el.style.removeProperty('transform')
      el.style.removeProperty('box-shadow')
      if (layer) {
        layer.style.transition = 'transform 460ms var(--ease-out), background-color 150ms ease, color 150ms ease'
        layer.style.transform = ''
      }
    }

    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    tiltStore.set(el, { enter, move, leave })
  },
  unmounted(el) {
    const h = tiltStore.get(el)
    if (!h) return
    el.removeEventListener('pointerenter', h.enter)
    el.removeEventListener('pointermove', h.move)
    el.removeEventListener('pointerleave', h.leave)
    tiltStore.delete(el)
  },
}

/* v-magnetic: the control drifts a few pixels toward the cursor and snaps
   back with a soft spring. Pressing sinks it into its shadow so the
   mechanical press still reads (the shadow flatten comes from .press-shadow). */

interface MagneticOptions {
  strength?: number
  max?: number
}

interface MagHandlers {
  enter: () => void
  move: (e: PointerEvent) => void
  down: () => void
  up: () => void
  leave: () => void
}

const magStore = new WeakMap<HTMLElement, MagHandlers>()

export const vMagnetic: Directive<HTMLElement, MagneticOptions | undefined> = {
  mounted(el, binding) {
    if (!pointerFine()) return
    const opts = binding.value ?? {}
    const strength = opts.strength ?? 0.25
    const max = opts.max ?? 5

    let raf = 0
    let rect: DOMRect | null = null
    let dx = 0
    let dy = 0
    let pressed = false

    const clamp = (v: number) => Math.max(-max, Math.min(max, v))
    const transitions =
      'transform DURATION var(--ease-snap), background-color 150ms ease, color 150ms ease'

    const render = () => {
      raf = 0
      const x = pressed ? 2 : clamp(dx)
      const y = pressed ? 2 : clamp(dy)
      el.style.setProperty('transform', `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`, 'important')
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(render)
    }

    const enter = () => {
      rect = el.getBoundingClientRect()
      el.style.transition = transitions.replace('DURATION', '200ms')
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!rect) rect = el.getBoundingClientRect()
      dx = (e.clientX - (rect.left + rect.width / 2)) * strength
      dy = (e.clientY - (rect.top + rect.height / 2)) * strength
      schedule()
    }
    const down = () => {
      pressed = true
      schedule()
    }
    const up = () => {
      pressed = false
      schedule()
    }
    const leave = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
      rect = null
      pressed = false
      dx = 0
      dy = 0
      el.style.transition = transitions.replace('DURATION', '350ms')
      el.style.removeProperty('transform')
    }

    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', leave)
    magStore.set(el, { enter, move, down, up, leave })
  },
  unmounted(el) {
    const h = magStore.get(el)
    if (!h) return
    el.removeEventListener('pointerenter', h.enter)
    el.removeEventListener('pointermove', h.move)
    el.removeEventListener('pointerdown', h.down)
    el.removeEventListener('pointerup', h.up)
    el.removeEventListener('pointerleave', h.leave)
    magStore.delete(el)
  },
}
