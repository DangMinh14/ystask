<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import UiButton from '../../components/ui/UiButton.vue'
import UiInput from '../../components/ui/UiInput.vue'
import { useAuthStore } from '../../stores/auth'
import { ApiError } from '../../services/http'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login({ email: email.value.trim(), password: password.value })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/app'
    router.push(redirect)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-ink">Sign in</h1>
    <p class="mt-1 text-sm text-ink-mid">Good to see you again.</p>

    <form class="mt-6 flex flex-col gap-4" novalidate @submit.prevent="submit">
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
        placeholder="••••••••"
        autocomplete="current-password"
        required
      />
      <p v-if="error" role="alert" class="rounded-sm border-2 border-(--color-danger) bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
        {{ error }}
      </p>
      <UiButton type="submit" :loading="loading" block>Sign in</UiButton>
    </form>

    <p class="mt-6 text-center text-sm text-ink-mid">
      New here?
      <RouterLink to="/auth/register" class="font-semibold text-accent-strong hover:underline">Create an account</RouterLink>
    </p>
  </div>
</template>
