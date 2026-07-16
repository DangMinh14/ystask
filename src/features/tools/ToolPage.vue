<script setup lang="ts">
import { computed, defineAsyncComponent, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { findTool, tools } from './registry'

const route = useRoute()

const tool = computed(() => findTool(String(route.params.toolId)))

const toolComponent = computed(() =>
  tool.value ? defineAsyncComponent(tool.value.component) : null,
)

const related = computed(() => tools.filter((t) => t.id !== tool.value?.id).slice(0, 3))

watchEffect(() => {
  document.title = tool.value
    ? `${tool.value.name} | Ystask`
    : 'Ystask: tools and trackers for your day'
})
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
    <template v-if="tool">
      <RouterLink
        to="/#tools"
        class="inline-flex items-center gap-2 text-sm font-medium text-ink-mid transition-colors hover:text-ink"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        All tools
      </RouterLink>

      <header class="mt-4 flex items-center gap-4">
        <div class="flex size-12 shrink-0 rotate-[-3deg] items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong shadow-button">
          <component :is="tool.icon" class="size-6" aria-hidden="true" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-ink sm:text-3xl">{{ tool.name }}</h1>
          <p class="mt-1 text-sm text-ink-mid">{{ tool.description }}</p>
        </div>
      </header>

      <div class="mt-8">
        <component :is="toolComponent" />
      </div>

      <section class="mt-14" aria-label="More tools">
        <h2 class="text-eyebrow">More tools</h2>
        <div class="stagger mt-3 grid gap-3 sm:grid-cols-3">
          <RouterLink
            v-for="t in related"
            :key="t.id"
            v-tilt="{ max: 5 }"
            :to="`/tools/${t.id}`"
            class="surface flex items-center gap-3 p-4"
          >
            <div data-tilt-layer class="flex size-10 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong bg-accent-soft text-accent-strong">
              <component :is="t.icon" class="size-5" aria-hidden="true" />
            </div>
            <span class="text-sm font-semibold text-ink">{{ t.name }}</span>
          </RouterLink>
        </div>
      </section>
    </template>

    <div v-else class="py-20 text-center">
      <h1 class="text-2xl font-bold text-ink">Tool not found</h1>
      <RouterLink to="/#tools" class="mt-4 inline-block font-semibold text-accent-strong hover:underline">
        Browse all tools
      </RouterLink>
    </div>
  </div>
</template>
