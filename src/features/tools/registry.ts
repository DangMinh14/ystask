import type { Component, FunctionalComponent } from 'vue'
import {
  CaseSensitive,
  Disc3,
  KeyRound,
  QrCode,
  Ruler,
  Braces,
  Timer,
  Signature,
  HeartPulse,
  Keyboard,
  Banknote,
  CalendarDays,
  WrapText,
} from 'lucide-vue-next'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  icon: FunctionalComponent
  /** Lazy-loaded tool component. */
  component: () => Promise<{ default: Component }>
}

/**
 * Registry of instant tools. Adding a tool here automatically creates
 * its route (/tools/:id) and its card on the home page.
 */
export const tools: ToolDefinition[] = [
  {
    id: 'character-counter',
    name: 'Character counter',
    description: 'Count characters, words, sentences and reading time.',
    icon: CaseSensitive,
    component: () => import('./char-counter/CharCounterTool.vue'),
  },
  {
    id: 'spin-wheel',
    name: 'Spin wheel',
    description: 'Add your options and let the wheel pick one at random.',
    icon: Disc3,
    component: () => import('./spin-wheel/SpinWheelTool.vue'),
  },
  {
    id: 'password-generator',
    name: 'Password generator',
    description: 'Generate strong passwords with custom length and characters.',
    icon: KeyRound,
    component: () => import('./password-generator/PasswordGeneratorTool.vue'),
  },
  {
    id: 'qr-code',
    name: 'QR code',
    description: 'Turn any link or text into a QR code and download it as PNG.',
    icon: QrCode,
    component: () => import('./qr-generator/QrGeneratorTool.vue'),
  },
  {
    id: 'unit-converter',
    name: 'Unit converter',
    description: 'Convert length, weight, temperature, data and speed.',
    icon: Ruler,
    component: () => import('./unit-converter/UnitConverterTool.vue'),
  },
  {
    id: 'json-formatter',
    name: 'JSON formatter',
    description: 'Pretty-print, minify and validate JSON strings.',
    icon: Braces,
    component: () => import('./json-formatter/JsonFormatterTool.vue'),
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    description: 'A 25 minute focus timer with short breaks in between.',
    icon: Timer,
    component: () => import('./pomodoro/PomodoroTool.vue'),
  },
  {
    id: 'email-signature',
    name: 'Email signature',
    description: 'Build a clean HTML email signature with a live preview.',
    icon: Signature,
    component: () => import('./email-signature/EmailSignatureTool.vue'),
  },
  {
    id: 'bmi-calculator',
    name: 'BMI calculator',
    description: 'Check your body mass index and healthy weight range.',
    icon: HeartPulse,
    component: () => import('./bmi-calculator/BmiCalculatorTool.vue'),
  },
  {
    id: 'typing-test',
    name: 'Typing test',
    description: 'A 60 second speed test in English or Vietnamese, with WPM and accuracy.',
    icon: Keyboard,
    component: () => import('./typing-test/TypingTestTool.vue'),
  },
  {
    id: 'currency-converter',
    name: 'Currency converter',
    description: 'Convert between popular currencies with daily reference rates.',
    icon: Banknote,
    component: () => import('./currency-converter/CurrencyConverterTool.vue'),
  },
  {
    id: 'day-counter',
    name: 'Day counter',
    description: 'Count the days between two dates, with weeks and working days.',
    icon: CalendarDays,
    component: () => import('./day-counter/DayCounterTool.vue'),
  },
  {
    id: 'line-break-remover',
    name: 'Line break remover',
    description: 'Strip line breaks from pasted text, with or without paragraphs.',
    icon: WrapText,
    component: () => import('./line-break-remover/LineBreakRemoverTool.vue'),
  },
]

export function findTool(id: string): ToolDefinition | undefined {
  return tools.find((t) => t.id === id)
}
