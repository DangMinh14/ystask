<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import BrandMark from '../../components/layout/BrandMark.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
    <RouterLink to="/" class="mb-8 flex items-center gap-3" aria-label="Ystask home">
      <BrandMark class="size-10" />
      <span class="text-2xl font-bold tracking-tight text-ink">Ystask</span>
    </RouterLink>
    <div class="surface w-full max-w-md p-6 sm:p-8">
      <RouterView />
    </div>
    <p class="mt-6 text-sm text-ink-faint">part of ystasearea.space</p>
  </div>
</template>
