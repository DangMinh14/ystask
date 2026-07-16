<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useAuthStore } from '../../stores/auth'
import { ApiError } from '../../services/http'

const auth = useAuthStore()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

const confirmError = computed(() =>
  confirm.value && confirm.value !== password.value ? 'Passwords do not match.' : '',
)

async function submit() {
  if (confirmError.value) return
  error.value = ''
  loading.value = true
  try {
    await auth.register({
      email: email.value.trim(),
      displayName: displayName.value.trim(),
      password: password.value,
    })
    router.push('/app')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-ink">Create your account</h1>
    <p class="mt-1 text-sm text-ink-mid">Track habits, expenses and job applications, free.</p>

    <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
      <UiInput
        v-model="displayName"
        label="Display name"
        placeholder="Alex Nguyen"
        autocomplete="name"
        required
      />
      <UiInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
      <UiInput
        v-model="password"
        label="Password"
        type="password"
        hint="At least 8 characters."
        autocomplete="new-password"
        required
      />
      <UiInput
        v-model="confirm"
        label="Confirm password"
        type="password"
        :error="confirmError"
        autocomplete="new-password"
        required
      />
      <p v-if="error" role="alert" class="rounded-sm border-2 border-(--color-danger) bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
        {{ error }}
      </p>
      <UiButton type="submit" :loading="loading" block>Sign up</UiButton>
    </form>

    <p class="mt-6 text-center text-sm text-ink-mid">
      Already have an account?
      <RouterLink to="/auth/login" class="font-semibold text-accent-strong hover:underline">Sign in</RouterLink>
    </p>
  </div>
</template>
