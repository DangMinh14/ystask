import type { FunctionalComponent } from 'vue'
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Gamepad2,
  CircleEllipsis,
  Banknote,
  PiggyBank,
  Wallet,
  Home,
  GraduationCap,
  Stethoscope,
} from 'lucide-vue-next'

/** Icon set for expense categories (name stored in DB → component). */
export const CATEGORY_ICONS: Record<string, FunctionalComponent> = {
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  receipt: Receipt,
  'gamepad-2': Gamepad2,
  'circle-ellipsis': CircleEllipsis,
  banknote: Banknote,
  'piggy-bank': PiggyBank,
  wallet: Wallet,
  home: Home,
  'graduation-cap': GraduationCap,
  stethoscope: Stethoscope,
}

export function categoryIcon(name: string): FunctionalComponent {
  return CATEGORY_ICONS[name] ?? Wallet
}
