<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Target,
  AlertTriangle,
  Pencil,
  Trash2,
  Wallet,
} from 'lucide-vue-next'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiStat from '../../components/ui/UiStat.vue'
import CategoryDonutChart from '../../features/expenses/CategoryDonutChart.vue'
import TrendLineChart from '../../features/expenses/TrendLineChart.vue'
import TransactionFormModal from '../../features/expenses/TransactionFormModal.vue'
import { categoryIcon } from '../../features/expenses/categoryIcons'
import {
  expensesService,
  type CategoryDto,
  type MonthlySummary,
  type TransactionDto,
  type TransactionPayload,
} from '../../services/expensesService'
import { ApiError } from '../../services/http'
import { useToastStore } from '../../stores/toast'
import { formatVND } from '../../utils/money'
import { formatMonthYear } from '../../utils/date'

const toast = useToastStore()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const categories = ref<CategoryDto[]>([])
const transactions = ref<TransactionDto[]>([])
const summary = ref<MonthlySummary | null>(null)
const loading = ref(true)
const saving = ref(false)

const formOpen = ref(false)
const editing = ref<TransactionDto | null>(null)
const deleting = ref<TransactionDto | null>(null)

const budgetOpen = ref(false)
const budgetInput = ref<number | string>('')

const isCurrentMonth = computed(
  () => year.value === now.getFullYear() && month.value === now.getMonth() + 1,
)

const grouped = computed(() => {
  const map = new Map<string, TransactionDto[]>()
  for (const t of transactions.value) {
    const list = map.get(t.date) ?? []
    list.push(t)
    map.set(t.date, list)
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
})

function shiftMonth(delta: number) {
  const d = new Date(year.value, month.value - 1 + delta, 1)
  year.value = d.getFullYear()
  month.value = d.getMonth() + 1
}

async function loadMonth() {
  loading.value = true
  try {
    const [txs, sum] = await Promise.all([
      expensesService.transactions(year.value, month.value),
      expensesService.summary(year.value, month.value),
    ])
    transactions.value = txs
    summary.value = sum
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not load your expenses.')
  } finally {
    loading.value = false
  }
}

async function refreshSummary() {
  try {
    summary.value = await expensesService.summary(year.value, month.value)
  } catch {
    /* keep stale summary */
  }
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(t: TransactionDto) {
  editing.value = t
  formOpen.value = true
}

async function save(payload: TransactionPayload) {
  saving.value = true
  try {
    if (editing.value) {
      await expensesService.updateTransaction(editing.value.id, payload)
      toast.success('Transaction updated.')
    } else {
      await expensesService.createTransaction(payload)
      toast.success('Transaction added.')
    }
    formOpen.value = false
    await loadMonth()
    warnBudget()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not save the transaction.')
  } finally {
    saving.value = false
  }
}

function warnBudget() {
  const b = summary.value?.budget
  if (!b?.limit) return
  if (b.isOver) toast.warning(`You are over this month's budget of ${formatVND(b.limit)}.`)
  else if (b.isNear) toast.info(`You have used ${b.percent}% of this month's budget.`)
}

async function confirmDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await expensesService.deleteTransaction(deleting.value.id)
    transactions.value = transactions.value.filter((t) => t.id !== deleting.value!.id)
    deleting.value = null
    toast.success('Transaction deleted.')
    refreshSummary()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not delete the transaction.')
  } finally {
    saving.value = false
  }
}

function openBudget() {
  budgetInput.value = summary.value?.budget.limit ?? ''
  budgetOpen.value = true
}

async function saveBudget() {
  const value = Number(budgetInput.value)
  if (!Number.isFinite(value) || value <= 0) {
    toast.error('Budget must be greater than zero.')
    return
  }
  saving.value = true
  try {
    await expensesService.setBudget({ year: year.value, month: month.value, limitAmount: value })
    budgetOpen.value = false
    toast.success('Monthly budget saved.')
    refreshSummary()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not save the budget.')
  } finally {
    saving.value = false
  }
}

function formatDateHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

onMounted(async () => {
  try {
    categories.value = await expensesService.categories()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not load categories.')
  }
  await loadMonth()
})

watch([year, month], loadMonth)
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-ink">Expenses</h1>
        <p class="mt-1 text-sm text-ink-mid">Log income and spending, and keep the budget honest.</p>
      </div>
      <div class="flex items-center gap-2">
        <UiButton variant="secondary" @click="openBudget">
          <Target class="size-4" aria-hidden="true" />
          Budget
        </UiButton>
        <UiButton @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          Add transaction
        </UiButton>
      </div>
    </header>

    <!-- Month picker -->
    <div class="flex items-center justify-center gap-2">
      <button
        type="button"
        class="press flex size-10 items-center justify-center rounded-sm border-2 border-line-strong text-ink hover:bg-accent-soft"
        aria-label="Previous month"
        @click="shiftMonth(-1)"
      >
        <ChevronLeft class="size-5" />
      </button>
      <span class="min-w-40 text-center text-lg font-bold text-ink">{{ formatMonthYear(year, month) }}</span>
      <button
        type="button"
        class="press flex size-10 items-center justify-center rounded-sm border-2 border-line-strong text-ink hover:bg-accent-soft disabled:opacity-40"
        aria-label="Next month"
        :disabled="isCurrentMonth"
        @click="shiftMonth(1)"
      >
        <ChevronRight class="size-5" />
      </button>
    </div>

    <!-- Budget warning banner -->
    <div
      v-if="summary?.budget.isOver"
      role="alert"
      class="flex items-center gap-3 rounded-sm border-2 border-(--color-danger) bg-danger-soft px-4 py-3 text-sm font-semibold text-danger shadow-button"
    >
      <AlertTriangle class="size-5 shrink-0" aria-hidden="true" />
      You have spent {{ formatVND(summary.budget.spent) }}, which is over this month's budget of {{ formatVND(summary.budget.limit!) }}.
    </div>
    <div
      v-else-if="summary?.budget.isNear"
      role="alert"
      class="flex items-center gap-3 rounded-sm border-2 border-(--color-warning) bg-warning-soft px-4 py-3 text-sm font-semibold text-warning shadow-button"
    >
      <AlertTriangle class="size-5 shrink-0" aria-hidden="true" />
      You have used {{ summary.budget.percent }}% of this month's budget. Spend carefully.
    </div>

    <!-- Stats -->
    <div v-if="summary" class="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <UiStat label="Income" :count="summary.totalIncome" :formatter="formatVND" :icon="TrendingUp" />
      <UiStat label="Spending" :count="summary.totalExpense" :formatter="formatVND" :icon="TrendingDown" tone="danger" />
      <UiStat label="Balance" :count="summary.balance" :formatter="formatVND" :icon="Scale" :tone="summary.balance < 0 ? 'danger' : 'accent'" />
      <div class="surface flex flex-col justify-center gap-2 p-5">
        <div class="flex items-center justify-between text-sm">
          <span class="font-medium text-ink-mid">Monthly budget</span>
          <button type="button" class="font-semibold text-accent-strong hover:underline" @click="openBudget">
            {{ summary.budget.limit ? 'Edit' : 'Set' }}
          </button>
        </div>
        <template v-if="summary.budget.limit">
          <p class="tabular-nums text-lg font-bold text-ink">
            {{ formatVND(summary.budget.spent) }}
            <span class="text-sm font-normal text-ink-faint">/ {{ formatVND(summary.budget.limit) }}</span>
          </p>
          <div class="h-3 overflow-hidden rounded-xs border-2 border-line-strong bg-(--background-primary)" role="progressbar" :aria-valuenow="Math.min(summary.budget.percent, 100)" aria-valuemin="0" aria-valuemax="100">
            <div
              class="h-full transition-all duration-300"
              :class="summary.budget.isOver ? 'bg-danger' : summary.budget.isNear ? 'bg-warning' : 'bg-accent'"
              :style="{ width: `${Math.min(summary.budget.percent, 100)}%` }"
            />
          </div>
        </template>
        <p v-else class="text-sm text-ink-faint">No budget set for this month.</p>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid gap-4 lg:grid-cols-2">
      <UiCard>
        <h2 class="mb-4 text-base font-bold text-ink">Spending by category</h2>
        <CategoryDonutChart
          v-if="summary && summary.expenseByCategory.length"
          :categories="summary.expenseByCategory"
        />
        <p v-else class="flex h-72 items-center justify-center text-sm text-ink-faint">
          Nothing spent this month yet.
        </p>
      </UiCard>
      <UiCard>
        <h2 class="mb-4 text-base font-bold text-ink">Six month trend</h2>
        <TrendLineChart v-if="summary" :trend="summary.trend" />
      </UiCard>
    </div>

    <!-- Transactions -->
    <section aria-label="Transaction list">
      <div v-if="loading" class="grid gap-3">
        <div v-for="i in 3" :key="i" class="surface h-20 animate-pulse" />
      </div>

      <UiCard v-else-if="transactions.length === 0" :padded="false">
        <UiEmptyState
          :icon="Wallet"
          title="No transactions yet"
          description="Add the first income or expense of the month to start tracking."
        >
          <UiButton @click="openCreate">
            <Plus class="size-4" aria-hidden="true" />
            Add transaction
          </UiButton>
        </UiEmptyState>
      </UiCard>

      <div v-else class="stagger flex flex-col gap-5">
        <div v-for="[date, items] in grouped" :key="date">
          <h3 class="text-eyebrow mb-2">{{ formatDateHeading(date) }}</h3>
          <div class="surface divide-y-2 divide-(--border-subtle)">
            <div v-for="t in items" :key="t.id" class="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong text-white"
                :style="{ background: t.categoryColor }"
              >
                <component :is="categoryIcon(t.categoryIcon)" class="size-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink">{{ t.categoryName }}</p>
                <p v-if="t.note" class="truncate text-xs text-ink-faint">{{ t.note }}</p>
              </div>
              <p class="tabular-nums shrink-0 text-sm font-bold" :class="t.type === 'Income' ? 'text-success' : 'text-ink'">
                {{ t.type === 'Income' ? '+' : '-' }}{{ formatVND(t.amount) }}
              </p>
              <div class="flex shrink-0 items-center">
                <button
                  type="button"
                  class="press flex size-8 items-center justify-center rounded-sm text-ink-mid hover:bg-accent-soft hover:text-ink"
                  aria-label="Edit transaction"
                  @click="openEdit(t)"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  type="button"
                  class="press flex size-8 items-center justify-center rounded-sm text-ink-mid hover:bg-danger-soft hover:text-danger"
                  aria-label="Delete transaction"
                  @click="deleting = t"
                >
                  <Trash2 class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <TransactionFormModal
      :open="formOpen"
      :transaction="editing"
      :categories="categories"
      :saving="saving"
      @close="formOpen = false"
      @save="save"
    />

    <!-- Budget modal -->
    <UiModal :open="budgetOpen" :title="`Budget for ${formatMonthYear(year, month)}`" size="sm" @close="budgetOpen = false">
      <form id="budget-form" class="flex flex-col gap-4" @submit.prevent="saveBudget">
        <UiInput
          v-model="budgetInput"
          label="Spending limit (VND)"
          type="number"
          min="1000"
          step="100000"
          placeholder="10000000"
          hint="You get a warning at 80% and an alert when you go over."
          required
        />
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="budgetOpen = false">Cancel</UiButton>
          <UiButton type="submit" form="budget-form" :loading="saving">Save budget</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Delete confirm -->
    <UiModal :open="!!deleting" title="Delete transaction" size="sm" @close="deleting = null">
      <p class="text-ink-mid">
        Delete this <strong class="text-ink">{{ deleting ? formatVND(deleting.amount) : '' }}</strong>
        transaction ({{ deleting?.categoryName }})?
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="deleting = null">Cancel</UiButton>
          <UiButton variant="danger" :loading="saving" @click="confirmDelete">Delete</UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>
