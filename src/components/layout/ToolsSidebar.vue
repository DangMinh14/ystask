<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Home, Moon, Sun, MonitorSmartphone, Languages } from 'lucide-vue-next'
import { tools } from '../../features/tools/registry'
import { useTheme } from '../../composables/useTheme'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const { preference, cycleTheme } = useTheme()

const themeIcon = computed(
  () => ({ system: MonitorSmartphone, light: Sun, dark: Moon })[preference.value],
)
const themeLabel = computed(
  () => ({ system: 'System theme', light: 'Light theme', dark: 'Dark theme' })[preference.value],
)

const activeToolId = computed(() =>
  route.name === 'tool' ? String(route.params.toolId) : null,
)
</script>

<template>
  <div class="flex h-full flex-col">
    <nav class="flex-1 overflow-y-auto p-3" aria-label="Tools">
      <RouterLink
        to="/"
        class="flex items-center gap-3 rounded-sm border-2 px-3 py-2 text-sm font-semibold transition-colors"
        :class="
          route.name === 'home'
            ? 'border-line-strong bg-accent text-on-accent shadow-button'
            : 'border-transparent text-ink-mid hover:bg-accent-soft hover:text-ink'
        "
        @click="emit('navigate')"
      >
        <Home class="size-4.5 shrink-0" aria-hidden="true" />
        Home
      </RouterLink>

      <p class="text-eyebrow mt-4 px-3">All tools</p>
      <ul class="mt-1.5 flex flex-col gap-0.5">
        <li v-for="tool in tools" :key="tool.id">
          <RouterLink
            :to="`/tools/${tool.id}`"
            class="flex items-center gap-3 rounded-sm border-2 px-3 py-2 text-sm font-semibold transition-colors"
            :class="
              activeToolId === tool.id
                ? 'border-line-strong bg-accent text-on-accent shadow-button'
                : 'border-transparent text-ink-mid hover:bg-accent-soft hover:text-ink'
            "
            :aria-current="activeToolId === tool.id ? 'page' : undefined"
            @click="emit('navigate')"
          >
            <component :is="tool.icon" class="size-4.5 shrink-0" aria-hidden="true" />
            <span class="truncate">{{ tool.name }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- Preferences -->
    <div class="flex flex-col gap-2 border-t-2 border-line-strong p-3">
      <button
        type="button"
        class="press flex w-full items-center gap-3 rounded-sm border-2 border-line-strong bg-solid px-3 py-2 text-sm font-semibold text-ink hover:bg-accent-soft"
        :aria-label="`${themeLabel}. Click to change`"
        @click="cycleTheme"
      >
        <component :is="themeIcon" class="size-4.5 shrink-0" aria-hidden="true" />
        {{ themeLabel }}
      </button>
      <button
        type="button"
        class="flex w-full cursor-not-allowed items-center gap-3 rounded-sm border-2 border-line px-3 py-2 text-sm font-semibold text-ink-faint"
        disabled
        title="Vietnamese is coming later"
      >
        <Languages class="size-4.5 shrink-0" aria-hidden="true" />
        English
        <span class="ml-auto rounded-xs border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">vi soon</span>
      </button>
    </div>
  </div>
</template>
