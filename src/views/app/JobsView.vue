<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import draggable from 'vuedraggable'
import {
  Plus,
  BriefcaseBusiness,
  CalendarClock,
  MapPin,
  Banknote,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-vue-next'
import UiButton from '../../components/ui/UiButton.vue'
import UiCard from '../../components/ui/UiCard.vue'
import UiEmptyState from '../../components/ui/UiEmptyState.vue'
import UiModal from '../../components/ui/UiModal.vue'
import JobFormModal from '../../features/jobs/JobFormModal.vue'
import {
  jobsService,
  JOB_STATUSES,
  type JobApplicationDto,
  type JobPayload,
  type JobStatus,
} from '../../services/jobsService'
import { ApiError } from '../../services/http'
import { useToastStore } from '../../stores/toast'

const toast = useToastStore()

const columns = reactive<Record<JobStatus, JobApplicationDto[]>>({
  Applied: [],
  Interview: [],
  Offer: [],
  Rejected: [],
})
const loading = ref(true)
const saving = ref(false)
const formOpen = ref(false)
const editing = ref<JobApplicationDto | null>(null)
const deleting = ref<JobApplicationDto | null>(null)

const COLUMN_STYLES: Record<JobStatus, { dot: string; badge: string }> = {
  Applied: { dot: 'bg-info', badge: 'bg-info-soft text-info' },
  Interview: { dot: 'bg-warning', badge: 'bg-warning-soft text-warning' },
  Offer: { dot: 'bg-success', badge: 'bg-success-soft text-success' },
  Rejected: { dot: 'bg-danger', badge: 'bg-danger-soft text-danger' },
}

function fillColumns(jobs: JobApplicationDto[]) {
  for (const s of ['Applied', 'Interview', 'Offer', 'Rejected'] as JobStatus[]) {
    columns[s] = jobs.filter((j) => j.status === s).sort((a, b) => a.sortOrder - b.sortOrder)
  }
}

async function load() {
  try {
    fillColumns(await jobsService.list())
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not load your applications.')
  } finally {
    loading.value = false
  }
}

/**
 * vuedraggable emits `added`/`moved` on the receiving list.
 * Persist the new column + index; reload on failure to stay consistent.
 */
async function onDrop(status: JobStatus, event: {
  added?: { element: JobApplicationDto; newIndex: number }
  moved?: { element: JobApplicationDto; newIndex: number }
}) {
  const change = event.added ?? event.moved
  if (!change) return
  try {
    const updated = await jobsService.move(change.element.id, status, change.newIndex)
    change.element.status = updated.status
    change.element.sortOrder = updated.sortOrder
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not save the new position.')
    await load()
  }
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(job: JobApplicationDto) {
  editing.value = job
  formOpen.value = true
}

async function save(payload: JobPayload) {
  saving.value = true
  try {
    if (editing.value) {
      await jobsService.update(editing.value.id, payload)
      toast.success('Application updated.')
    } else {
      await jobsService.create(payload)
      toast.success('Application added.')
    }
    formOpen.value = false
    await load()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not save the application.')
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!deleting.value) return
  saving.value = true
  try {
    await jobsService.remove(deleting.value.id)
    toast.success('Application deleted.')
    deleting.value = null
    await load()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'Could not delete the application.')
  } finally {
    saving.value = false
  }
}

function formatInterview(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() > Date.now()
}

const totalJobs = () =>
  columns.Applied.length + columns.Interview.length + columns.Offer.length + columns.Rejected.length

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-ink">Job applications</h1>
        <p class="mt-1 text-sm text-ink-mid">Drag cards between columns to update their status.</p>
      </div>
      <UiButton @click="openCreate">
        <Plus class="size-4" aria-hidden="true" />
        Add application
      </UiButton>
    </header>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="surface h-64 animate-pulse" />
    </div>

    <UiCard v-else-if="totalJobs() === 0" :padded="false">
      <UiEmptyState
        :icon="BriefcaseBusiness"
        title="No applications yet"
        description="Add the first company you applied to and start tracking your search."
      >
        <UiButton @click="openCreate">
          <Plus class="size-4" aria-hidden="true" />
          Add your first application
        </UiButton>
      </UiEmptyState>
    </UiCard>

    <!-- Kanban board -->
    <div v-else class="stagger grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
      <section
        v-for="col in JOB_STATUSES"
        :key="col.value"
        class="rounded-md border-2 border-line-strong bg-(--surface-card) p-3 shadow-card"
        :aria-label="`${col.label} column`"
      >
        <header class="flex items-center gap-2 px-1 pb-3">
          <span class="size-2.5 rounded-full border border-line-strong" :class="COLUMN_STYLES[col.value].dot" aria-hidden="true" />
          <h2 class="text-sm font-bold text-ink">{{ col.label }}</h2>
          <span class="tabular-nums ml-auto rounded-xs border border-line-strong px-2 py-0.5 text-xs font-semibold" :class="COLUMN_STYLES[col.value].badge">
            {{ columns[col.value].length }}
          </span>
        </header>

        <draggable
          v-model="columns[col.value]"
          group="jobs"
          item-key="id"
          class="flex min-h-24 flex-col gap-2"
          ghost-class="kanban-ghost"
          drag-class="kanban-drag"
          :animation="180"
          @change="onDrop(col.value, $event)"
        >
          <template #item="{ element }">
            <article
              class="group cursor-grab rounded-sm border-2 border-line-strong bg-(--surface-solid) p-3 shadow-button transition-shadow active:cursor-grabbing"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-bold text-ink">{{ element.position }}</h3>
                  <p class="truncate text-sm text-ink-mid">{{ element.company }}</p>
                </div>
                <a
                  v-if="element.url"
                  :href="element.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="press shrink-0 rounded-xs p-1.5 text-ink-faint hover:bg-accent-soft hover:text-ink"
                  :aria-label="`Open job post for ${element.company}`"
                >
                  <ExternalLink class="size-3.5" />
                </a>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                <span v-if="element.salary" class="inline-flex items-center gap-1">
                  <Banknote class="size-3.5" aria-hidden="true" />{{ element.salary }}
                </span>
                <span v-if="element.location" class="inline-flex items-center gap-1">
                  <MapPin class="size-3.5" aria-hidden="true" />{{ element.location }}
                </span>
              </div>

              <p
                v-if="element.interviewAt"
                class="mt-2 inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 text-xs font-semibold"
                :class="isUpcoming(element.interviewAt) ? 'border-(--color-warning) bg-warning-soft text-warning' : 'border-line bg-(--border-subtle) text-ink-faint'"
              >
                <CalendarClock class="size-3.5" aria-hidden="true" />
                Interview {{ formatInterview(element.interviewAt) }}
              </p>

              <p v-if="element.note" class="mt-2 line-clamp-2 text-xs text-ink-mid">{{ element.note }}</p>

              <div class="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <button
                  type="button"
                  class="press flex size-7 items-center justify-center rounded-xs text-ink-mid hover:bg-accent-soft hover:text-ink"
                  :aria-label="`Edit application at ${element.company}`"
                  @click="openEdit(element)"
                >
                  <Pencil class="size-3.5" />
                </button>
                <button
                  type="button"
                  class="press flex size-7 items-center justify-center rounded-xs text-ink-mid hover:bg-danger-soft hover:text-danger"
                  :aria-label="`Delete application at ${element.company}`"
                  @click="deleting = element"
                >
                  <Trash2 class="size-3.5" />
                </button>
              </div>
            </article>
          </template>
        </draggable>
      </section>
    </div>

    <JobFormModal :open="formOpen" :job="editing" :saving="saving" @close="formOpen = false" @save="save" />

    <UiModal :open="!!deleting" title="Delete application" size="sm" @close="deleting = null">
      <p class="text-ink-mid">
        Delete <strong class="text-ink">{{ deleting?.position }}</strong> at
        <strong class="text-ink">{{ deleting?.company }}</strong>?
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

<style scoped>
.kanban-ghost {
  opacity: 0.4;
  border-style: dashed;
  border-color: var(--accent-color);
}
.kanban-drag {
  transform: rotate(2deg);
  box-shadow: var(--shadow-pop);
}
</style>
