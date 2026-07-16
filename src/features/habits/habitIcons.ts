import type { FunctionalComponent } from 'vue'
import {
  Target,
  BookOpen,
  Dumbbell,
  Droplets,
  Moon,
  Sunrise,
  PenLine,
  HeartPulse,
  Code,
  Music,
  Salad,
  Footprints,
} from 'lucide-vue-next'

/** Icon choices for habits (name stored in DB → component). */
export const HABIT_ICONS: Record<string, FunctionalComponent> = {
  target: Target,
  'book-open': BookOpen,
  dumbbell: Dumbbell,
  droplets: Droplets,
  moon: Moon,
  sunrise: Sunrise,
  'pen-line': PenLine,
  'heart-pulse': HeartPulse,
  code: Code,
  music: Music,
  salad: Salad,
  footprints: Footprints,
}

export const HABIT_COLORS = [
  '#047857',
  '#0369a1',
  '#7c3aed',
  '#b45309',
  '#be123c',
  '#0f766e',
  '#4d7c0f',
  '#6d28d9',
]

export function habitIcon(name: string): FunctionalComponent {
  return HABIT_ICONS[name] ?? Target
}
