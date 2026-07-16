<script setup lang="ts">
withDefaults(defineProps<{ padded?: boolean; hover?: boolean }>(), { padded: true, hover: false })
</script>

<template>
  <!-- min-w-0 lets the card shrink inside CSS grids instead of forcing overflow -->
  <div class="surface min-w-0" :class="[padded ? 'p-5 sm:p-6' : '', hover ? 'hover-lift' : '']">
    <slot />
  </div>
</template>
