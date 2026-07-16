<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import type { CategoryDto, TransactionDto, TransactionPayload, TransactionType } from '../../services/expensesService'
import { todayISO } from '../../utils/date'

const props = defineProps<{
  open: boolean
  transaction: TransactionDto | null
  categories: CategoryDto[]
  saving: boolean
}>()

const emit = defineEmits<{ close: []; save: [payload: TransactionPayload] }>()

const type = ref<TransactionType>('Expense')
const categoryId = ref<number | ''>('')
const amount = ref<number | string>('')
const note = ref('')
const date = ref(todayISO())
const amountError = ref('')

const categoryOptions = computed(() =>
  props.categories.filter((c) => c.type === type.value).map((c) => ({ value: c.id, label: c.name })),
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    type.value = props.transaction?.type ?? 'Expense'
    categoryId.value = props.transaction?.categoryId ?? ''
    amount.value = props.transaction?.amount ?? ''
    note.value = props.transaction?.note ?? ''
    date.value = props.transaction?.date ?? todayISO()
    amountError.value = ''
  },
)

// Reset category when switching type if it no longer matches.
watch(type, () => {
  if (!props.categories.some((c) => c.id === categoryId.value && c.type === type.value)) {
    categoryId.value = categoryOptions.value[0]?.value ?? ''
  }
})

function submit() {
  const value = Number(amount.value)
  if (!Number.isFinite(value) || value <= 0) {
    amountError.value = 'Amount must be greater than zero.'
    return
  }
  if (categoryId.value === '') return
  emit('save', {
    categoryId: categoryId.value,
    type: type.value,
    amount: value,
    note: note.value.trim() || null,
    date: date.value,
  })
}
</script>

<template>
  <UiModal :open="open" :title="transaction ? 'Edit transaction' : 'New transaction'" @close="emit('close')">
    <form id="transaction-form" class="flex flex-col gap-4" @submit.prevent="submit">
      <!-- Type toggle -->
      <div class="flex rounded-sm border-2 border-line-strong p-1" role="radiogroup" aria-label="Transaction type">
        <button
          type="button"
          role="radio"
          :aria-checked="type === 'Expense'"
          class="flex-1 rounded-xs px-4 py-2 text-sm font-semibold transition-colors"
          :class="type === 'Expense' ? 'bg-danger-soft text-danger' : 'text-ink-mid hover:text-ink'"
          @click="type = 'Expense'"
        >
          Expense
        </button>
        <button
          type="button"
          role="radio"
          :aria-checked="type === 'Income'"
          class="flex-1 rounded-xs px-4 py-2 text-sm font-semibold transition-colors"
          :class="type === 'Income' ? 'bg-success-soft text-success' : 'text-ink-mid hover:text-ink'"
          @click="type = 'Income'"
        >
          Income
        </button>
      </div>

      <UiInput
        v-model="amount"
        label="Amount (VND)"
        type="number"
        min="1000"
        step="1000"
        placeholder="50000"
        :error="amountError"
        required
      />
      <UiSelect
        v-model="categoryId"
        label="Category"
        :options="categoryOptions"
        placeholder="Pick a category"
        required
      />
      <UiInput v-model="date" label="Date" type="date" :max="todayISO()" required />
      <UiInput v-model="note" label="Note" placeholder="Lunch with the team, optional" />
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="emit('close')">Cancel</UiButton>
        <UiButton type="submit" form="transaction-form" :loading="saving" :disabled="categoryId === ''">
          {{ transaction ? 'Save changes' : 'Add transaction' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
