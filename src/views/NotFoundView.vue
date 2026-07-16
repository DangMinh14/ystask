<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
    <p class="text-eyebrow">Error 404</p>
    <h1 class="text-4xl font-bold text-ink">Page not found</h1>
    <p class="max-w-md text-ink-mid">This page does not exist or has moved.</p>
    <RouterLink
      to="/"
      class="press press-shadow mt-2 inline-flex h-11 items-center rounded-sm border-2 border-line-strong bg-accent px-6 text-sm font-semibold text-on-accent shadow-button hover:bg-accent-strong"
    >
      Back to home
    </RouterLink>
  </div>
</template>
