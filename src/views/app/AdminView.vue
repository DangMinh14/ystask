<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  Users,
  UserX,
  UserPlus,
  Flame,
  Wallet,
  BriefcaseBusiness,
  Lock,
  LockOpen,
  Search,
} from 'lucide-vue-next'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiBadge from '../../components/ui/UiBadge.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiStat from '../../components/ui/UiStat.vue'
import { adminService, type AdminUser, type SystemStats } from '../../services/adminService'
import { ApiError } from '../../services/http'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

const stats = ref<SystemStats | null>(null)
const users = ref<AdminUser[]>([])
const loading = ref(true)
const search = ref('')
const confirming = ref<AdminUser | null>(null)
const saving = ref(false)

let searchTimer: number | undefined

async function load() {
  try {
    const [s, u] = await Promise.all([adminService.stats(), adminService.users(search.value)])
    stats.value = s
    users.value = u
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not load admin data.')
  } finally {
    loading.value = false
  }
}

function onSearch() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(load, 350)
}

async function toggleLock() {
  if (!confirming.value) return
  saving.value = true
  const user = confirming.value
  try {
    if (user.isLocked) {
      await adminService.unlock(user.id)
      toast.success(`Unlocked ${user.email}.`)
    } else {
      await adminService.lock(user.id)
      toast.success(`Locked ${user.email}. Their data stays intact.`)
    }
    confirming.value = null
    await load()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not update the account.')
  } finally {
    saving.value = false
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US')
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-ink">Admin</h1>
      <p class="mt-1 text-sm text-ink-mid">Watch usage and manage accounts across Ystask.</p>
    </header>

    <!-- System stats -->
    <div v-if="stats" class="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <UiStat label="Users" :count="stats.totalUsers" :icon="Users" />
      <UiStat label="New this week" :count="stats.newUsersLast7Days" :icon="UserPlus" />
      <UiStat label="Locked" :count="stats.lockedUsers" :icon="UserX" :tone="stats.lockedUsers ? 'danger' : 'accent'" />
      <UiStat label="Habits" :count="stats.totalHabits" :sub="`${stats.totalCheckIns} check-ins`" :icon="Flame" />
      <UiStat label="Transactions" :count="stats.totalTransactions" :icon="Wallet" />
      <UiStat label="Applications" :count="stats.totalJobs" :icon="BriefcaseBusiness" />
    </div>

    <!-- Users table -->
    <UiCard :padded="false">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line-strong px-5 py-4">
        <h2 class="text-base font-bold text-ink">Users</h2>
        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            placeholder="Search by email or name"
            aria-label="Search users"
            class="h-10 w-64 rounded-sm border-2 border-line-strong bg-solid pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-(--accent-color)"
            @input="onSearch"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-175 text-left text-sm">
          <thead>
            <tr class="border-b-2 border-line-strong text-xs uppercase tracking-wide text-ink-faint">
              <th scope="col" class="px-5 py-3 font-semibold">User</th>
              <th scope="col" class="px-4 py-3 font-semibold">Role</th>
              <th scope="col" class="px-4 py-3 font-semibold">Joined</th>
              <th scope="col" class="tabular-nums px-4 py-3 text-center font-semibold">Habits</th>
              <th scope="col" class="tabular-nums px-4 py-3 text-center font-semibold">Transactions</th>
              <th scope="col" class="tabular-nums px-4 py-3 text-center font-semibold">Jobs</th>
              <th scope="col" class="px-4 py-3 font-semibold">Status</th>
              <th scope="col" class="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="px-5 py-10 text-center text-ink-faint">Loading</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="8" class="px-5 py-10 text-center text-ink-faint">No users found.</td>
            </tr>
            <tr v-for="user in users" v-else :key="user.id" class="border-b border-line last:border-0">
              <td class="px-5 py-3">
                <p class="font-semibold text-ink">{{ user.displayName }}</p>
                <p class="text-xs text-ink-faint">{{ user.email }}</p>
              </td>
              <td class="px-4 py-3">
                <UiBadge :kind="user.role === 'Admin' ? 'accent' : 'neutral'">
                  {{ user.role }}
                </UiBadge>
              </td>
              <td class="px-4 py-3 text-ink-mid">{{ formatDate(user.createdAt) }}</td>
              <td class="tabular-nums px-4 py-3 text-center text-ink-mid">{{ user.habitCount }}</td>
              <td class="tabular-nums px-4 py-3 text-center text-ink-mid">{{ user.transactionCount }}</td>
              <td class="tabular-nums px-4 py-3 text-center text-ink-mid">{{ user.jobCount }}</td>
              <td class="px-4 py-3">
                <UiBadge :kind="user.isLocked ? 'danger' : 'success'">
                  {{ user.isLocked ? 'Locked' : 'Active' }}
                </UiBadge>
              </td>
              <td class="px-5 py-3 text-right">
                <UiButton
                  v-if="user.role !== 'Admin'"
                  size="sm"
                  :variant="user.isLocked ? 'secondary' : 'danger'"
                  @click="confirming = user"
                >
                  <LockOpen v-if="user.isLocked" class="size-3.5" aria-hidden="true" />
                  <Lock v-else class="size-3.5" aria-hidden="true" />
                  {{ user.isLocked ? 'Unlock' : 'Lock' }}
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <!-- Lock/unlock confirm -->
    <UiModal
      :open="!!confirming"
      :title="confirming?.isLocked ? 'Unlock account' : 'Lock account'"
      size="sm"
      @close="confirming = null"
    >
      <p class="text-ink-mid">
        <template v-if="confirming?.isLocked">
          Let <strong class="text-ink">{{ confirming?.email }}</strong> sign in again?
        </template>
        <template v-else>
          Lock <strong class="text-ink">{{ confirming?.email }}</strong>? They will not be able to sign in,
          but all of their data stays intact.
        </template>
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UiButton variant="ghost" @click="confirming = null">Cancel</UiButton>
          <UiButton
            :variant="confirming?.isLocked ? 'primary' : 'danger'"
            :loading="saving"
            @click="toggleLock"
          >
            {{ confirming?.isLocked ? 'Unlock' : 'Lock account' }}
          </UiButton>
        </div>
      </template>
    </UiModal>
  </div>
</template>
