<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { Download } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'

const text = ref('https://ystasearea.space')
const canvas = ref<HTMLCanvasElement | null>(null)
const error = ref('')

async function render() {
  if (!canvas.value) return
  if (!text.value.trim()) {
    const ctx = canvas.value.getContext('2d')
    ctx?.clearRect(0, 0, canvas.value.width, canvas.value.height)
    return
  }
  try {
    error.value = ''
    await QRCode.toCanvas(canvas.value, text.value, {
      width: 280,
      margin: 2,
      color: { dark: '#16201c', light: '#ffffff' },
    })
  } catch {
    error.value = 'The content is too long to generate a QR code.'
  }
}

watch(text, render)
watch(canvas, render)

function download() {
  if (!canvas.value || !text.value.trim()) return
  const link = document.createElement('a')
  link.download = 'ystask-qr.png'
  link.href = canvas.value.toDataURL('image/png')
  link.click()
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="surface flex flex-col gap-4 p-5">
      <div class="flex flex-col gap-1.5">
        <label for="qr-input" class="text-sm font-medium text-ink">Link or text</label>
        <textarea
          id="qr-input"
          v-model="text"
          rows="5"
          placeholder="https://…"
          class="w-full resize-y rounded-sm border border-line-strong bg-solid p-3.5 text-base text-ink placeholder:text-ink-faint focus:border-accent"
        />
        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
      </div>
      <UiButton :disabled="!text.trim() || !!error" @click="download">
        <Download class="size-4" aria-hidden="true" />
        Download PNG
      </UiButton>
    </div>

    <div class="surface flex items-center justify-center p-6">
      <div class="rounded-sm bg-white p-3 shadow-card">
        <canvas ref="canvas" width="280" height="280" aria-label="Generated QR code" role="img" />
      </div>
    </div>
  </div>
</template>
