<script setup lang="ts">
import { ref, watch } from 'vue'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import UiModal from '../../components/ui/UiModal.vue'
import UiSelect from '../../components/ui/UiSelect.vue'
import {
  JOB_STATUSES,
  type JobApplicationDto,
  type JobPayload,
  type JobStatus,
} from '../../services/jobsService'
import { todayISO } from '../../utils/date'

const props = defineProps<{ open: boolean; job: JobApplicationDto | null; saving: boolean }>()
const emit = defineEmits<{ close: []; save: [payload: JobPayload] }>()

const company = ref('')
const position = ref('')
const status = ref<JobStatus>('Applied')
const salary = ref('')
const location = ref('')
const url = ref('')
const note = ref('')
const appliedDate = ref('')
const interviewAt = ref('')

watch(
  () => props.open,
  (open) => {
    if (!open) return
    company.value = props.job?.company ?? ''
    position.value = props.job?.position ?? ''
    status.value = props.job?.status ?? 'Applied'
    salary.value = props.job?.salary ?? ''
    location.value = props.job?.location ?? ''
    url.value = props.job?.url ?? ''
    note.value = props.job?.note ?? ''
    appliedDate.value = props.job?.appliedDate ?? todayISO()
    // Convert ISO UTC to a local datetime-local value (YYYY-MM-DDTHH:mm)
    if (props.job?.interviewAt) {
      const d = new Date(props.job.interviewAt)
      const pad = (n: number) => String(n).padStart(2, '0')
      interviewAt.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    } else {
      interviewAt.value = ''
    }
  },
)

function submit() {
  if (!company.value.trim() || !position.value.trim()) return
  emit('save', {
    company: company.value.trim(),
    position: position.value.trim(),
    status: status.value,
    salary: salary.value.trim() || null,
    location: location.value.trim() || null,
    url: url.value.trim() || null,
    note: note.value.trim() || null,
    appliedDate: appliedDate.value || null,
    interviewAt: interviewAt.value ? new Date(interviewAt.value).toISOString() : null,
  })
}
</script>

<template>
  <UiModal :open="open" :title="job ? 'Edit application' : 'New application'" @close="emit('close')">
    <form id="job-form" class="flex flex-col gap-4" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="company" label="Company" placeholder="Acme Corp" required />
        <UiInput v-model="position" label="Position" placeholder="Fullstack Engineer" required />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <UiSelect v-model="status" label="Status" :options="JOB_STATUSES" />
        <UiInput v-model="salary" label="Salary" placeholder="1,200 to 1,500 USD" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="location" label="Location" placeholder="Hanoi or remote" />
        <UiInput v-model="url" label="Job post link" type="url" placeholder="https://" />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <UiInput v-model="appliedDate" label="Applied on" type="date" :max="todayISO()" />
        <UiInput
          v-model="interviewAt"
          label="Interview"
          type="datetime-local"
          hint="Shows as a reminder on the board and dashboard."
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <label for="job-note" class="text-sm font-semibold text-ink">Notes</label>
        <textarea
          id="job-note"
          v-model="note"
          rows="3"
          placeholder="Contacts, interview rounds, impressions"
          class="w-full resize-y rounded-sm border-2 border-line-strong bg-solid p-3.5 text-base text-ink placeholder:text-ink-faint focus:border-(--accent-color)"
        />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="ghost" @click="emit('close')">Cancel</UiButton>
        <UiButton
          type="submit"
          form="job-form"
          :loading="saving"
          :disabled="!company.trim() || !position.trim()"
        >
          {{ job ? 'Save changes' : 'Add application' }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>
