import { http } from './http'

export type TransactionType = 'Expense' | 'Income'

export interface CategoryDto {
  id: number
  name: string
  type: TransactionType
  color: string
  icon: string
}

export interface TransactionDto {
  id: number
  categoryId: number
  categoryName: string
  categoryColor: string
  categoryIcon: string
  type: TransactionType
  amount: number
  note: string | null
  date: string
}

export interface TransactionPayload {
  categoryId: number
  type: TransactionType
  amount: number
  note: string | null
  date: string
}

export interface BudgetStatus {
  limit: number | null
  spent: number
  percent: number
  isOver: boolean
  isNear: boolean
}

export interface CategoryTotal {
  categoryId: number
  name: string
  color: string
  total: number
}

export interface MonthPoint {
  year: number
  month: number
  income: number
  expense: number
}

export interface MonthlySummary {
  year: number
  month: number
  totalIncome: number
  totalExpense: number
  balance: number
  budget: BudgetStatus
  expenseByCategory: CategoryTotal[]
  trend: MonthPoint[]
}

export const expensesService = {
  categories: () => http.get<CategoryDto[]>('/expenses/categories'),
  createCategory: (payload: { name: string; type: TransactionType; color: string; icon: string }) =>
    http.post<CategoryDto>('/expenses/categories', payload),

  transactions: (year: number, month: number) =>
    http.get<TransactionDto[]>(`/expenses/transactions?year=${year}&month=${month}`),
  createTransaction: (payload: TransactionPayload) =>
    http.post<TransactionDto>('/expenses/transactions', payload),
  updateTransaction: (id: number, payload: TransactionPayload) =>
    http.put<TransactionDto>(`/expenses/transactions/${id}`, payload),
  deleteTransaction: (id: number) => http.delete<void>(`/expenses/transactions/${id}`),

  setBudget: (payload: { year: number; month: number; limitAmount: number }) =>
    http.put<void>('/expenses/budget', payload),

  summary: (year: number, month: number) =>
    http.get<MonthlySummary>(`/expenses/summary?year=${year}&month=${month}`),
}
