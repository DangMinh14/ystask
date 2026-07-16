<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy, Plus, Trash2 } from 'lucide-vue-next'
import UiButton from '../../../components/ui/UiButton.vue'
import UiInput from '../../../components/ui/UiInput.vue'
import UiSelect from '../../../components/ui/UiSelect.vue'

interface SocialLink {
  label: string
  url: string
}

const fullName = ref('Alex Nguyen')
const jobTitle = ref('Software Engineer')
const company = ref('Acme Corp')

const email = ref('alex@example.com')
const phone = ref('+84 900 000 000')
const website = ref('https://example.com')
const address = ref('')

const socials = ref<SocialLink[]>([
  { label: 'LinkedIn', url: 'https://linkedin.com/in/alexnguyen' },
  { label: 'GitHub', url: 'https://github.com/alexnguyen' },
])

const logoUrl = ref('')
const accentColor = ref('#ea580c')
const textColor = ref('#333333')
const fontFamily = ref('Arial, Helvetica, sans-serif')

const FONT_OPTIONS = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
]

function addSocial() {
  if (socials.value.length >= 5) return
  socials.value.push({ label: '', url: '' })
}

function removeSocial(index: number) {
  socials.value.splice(index, 1)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value.trim())
}

/** Only allow http(s) and mailto links in the generated markup. */
function safeUrl(value: string): string {
  const url = value.trim()
  if (!url) return ''
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url
  if (/^[\w.-]+\.[a-z]{2,}([/?#]|$)/i.test(url)) return `https://${url}`
  return ''
}

const signatureHtml = computed(() => {
  const font = fontFamily.value
  const accent = accentColor.value
  const text = textColor.value
  const linkStyle = `color:${accent};text-decoration:none;font-weight:normal;font-size:14px`
  const labelStyle = `vertical-align:top;color:${accent};font-size:14px;font-family:${font};padding-right:6px;white-space:nowrap`
  const valueStyle = `vertical-align:top;color:${text};font-size:14px;font-family:${font}`

  const rows: string[] = []

  if (fullName.value.trim()) {
    rows.push(
      `<tr><td colspan="2" style="padding-bottom:4px;color:${accent};font-size:18px;font-weight:bold;font-family:${font}">${escapeHtml(fullName.value.trim())}</td></tr>`,
    )
  }
  const roleLine = [jobTitle.value.trim(), company.value.trim()].filter(Boolean).join(' at ')
  if (roleLine) {
    rows.push(
      `<tr><td colspan="2" style="padding-bottom:6px;color:${text};font-size:14px;font-family:${font}">${escapeHtml(roleLine)}</td></tr>`,
    )
  }

  const contactRow = (label: string, value: string) =>
    `<tr><td valign="top" style="${labelStyle}">${label}:</td><td valign="top" style="${valueStyle}">${value}</td></tr>`

  if (email.value.trim()) {
    rows.push(
      contactRow('e', `<a href="mailto:${escapeAttr(email.value)}" style="${linkStyle}" target="_blank">${escapeHtml(email.value.trim())}</a>`),
    )
  }
  if (phone.value.trim()) {
    rows.push(contactRow('p', escapeHtml(phone.value.trim())))
  }
  const site = safeUrl(website.value)
  if (site) {
    const display = site.replace(/^https?:\/\//i, '').replace(/\/$/, '')
    rows.push(contactRow('w', `<a href="${escapeAttr(site)}" style="${linkStyle}" target="_blank">${escapeHtml(display)}</a>`))
  }
  if (address.value.trim()) {
    rows.push(contactRow('a', escapeHtml(address.value.trim())))
  }

  const links = socials.value
    .map((s) => ({ label: s.label.trim(), url: safeUrl(s.url) }))
    .filter((s) => s.label && s.url)
  if (links.length) {
    const parts = links.map(
      (s) =>
        `<a href="${escapeAttr(s.url)}" style="color:${accent};text-decoration:none;font-weight:bold;font-size:13px;font-family:${font}" target="_blank">${escapeHtml(s.label)}</a>`,
    )
    rows.push(
      `<tr><td colspan="2" style="padding-top:8px;font-size:13px;color:${text}">${parts.join(`&nbsp;<span style="color:${text}">|</span>&nbsp;`)}</td></tr>`,
    )
  }

  const logo = safeUrl(logoUrl.value)
  const logoCell = logo
    ? `<td valign="top" style="padding:0px 12px 0px 0px;border-right:3px solid ${accent};vertical-align:top"><img width="88" height="88" src="${escapeAttr(logo)}" alt="${escapeAttr(company.value || 'Logo')}" style="border-radius:8px;display:block" /></td><td style="width:12px"></td>`
    : ''

  return `<table cellpadding="0" cellspacing="0" border="0" style="background:none;border:0px;margin:0px;padding:0px">
  <tbody><tr>
    ${logoCell}<td style="padding:0px">
      <table cellpadding="0" cellspacing="0" border="0" style="background:none;border:0px;margin:0px;padding:0px">
        <tbody>
          ${rows.join('\n          ')}
        </tbody>
      </table>
    </td>
  </tr></tbody>
</table>`
})

const copiedHtml = ref(false)
const copiedRich = ref(false)

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(signatureHtml.value)
    copiedHtml.value = true
    setTimeout(() => (copiedHtml.value = false), 1800)
  } catch {
    /* clipboard unavailable */
  }
}

async function copyRich() {
  try {
    const item = new ClipboardItem({
      'text/html': new Blob([signatureHtml.value], { type: 'text/html' }),
      'text/plain': new Blob([signatureHtml.value], { type: 'text/plain' }),
    })
    await navigator.clipboard.write([item])
    copiedRich.value = true
    setTimeout(() => (copiedRich.value = false), 1800)
  } catch {
    // Rich copy is not supported everywhere; fall back to plain HTML.
    copyHtml()
  }
}
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Form -->
    <div class="flex min-w-0 flex-col gap-5">
      <section class="surface flex flex-col gap-3 p-5">
        <h2 class="text-sm font-bold uppercase tracking-wide text-ink">Personal</h2>
        <UiInput v-model="fullName" label="Full name" placeholder="Alex Nguyen" />
        <UiInput v-model="jobTitle" label="Job title" placeholder="Software Engineer" />
        <UiInput v-model="company" label="Company" placeholder="Acme Corp" />
      </section>

      <section class="surface flex flex-col gap-3 p-5">
        <h2 class="text-sm font-bold uppercase tracking-wide text-ink">Contact</h2>
        <UiInput v-model="email" label="Email" type="email" placeholder="you@company.com" />
        <UiInput v-model="phone" label="Phone" placeholder="+84 900 000 000" />
        <UiInput v-model="website" label="Website" placeholder="https://example.com" />
        <UiInput v-model="address" label="Address" placeholder="Ho Chi Minh City, Vietnam" />
      </section>

      <section class="surface flex flex-col gap-3 p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold uppercase tracking-wide text-ink">Social links</h2>
          <UiButton size="sm" variant="ghost" :disabled="socials.length >= 5" @click="addSocial">
            <Plus class="size-4" aria-hidden="true" />
            Add link
          </UiButton>
        </div>
        <div v-for="(social, i) in socials" :key="i" class="flex items-end gap-2">
          <div class="w-32 shrink-0">
            <UiInput v-model="social.label" label="Label" placeholder="LinkedIn" />
          </div>
          <div class="flex-1">
            <UiInput v-model="social.url" label="URL" placeholder="https://linkedin.com/in/you" />
          </div>
          <button
            type="button"
            class="press mb-1 flex size-9 shrink-0 items-center justify-center rounded-sm border-2 border-line-strong text-ink-mid hover:bg-danger-soft hover:text-danger"
            :aria-label="`Remove link ${i + 1}`"
            @click="removeSocial(i)"
          >
            <Trash2 class="size-4" />
          </button>
        </div>
        <p v-if="socials.length === 0" class="text-sm text-ink-faint">No links yet. Add LinkedIn, GitHub, or anything else.</p>
      </section>

      <section class="surface flex flex-col gap-3 p-5">
        <h2 class="text-sm font-bold uppercase tracking-wide text-ink">Formatting</h2>
        <UiInput v-model="logoUrl" label="Logo URL" placeholder="https://example.com/logo.png" hint="Optional. A square image around 100x100 works best." />
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label for="sig-accent" class="text-sm font-semibold text-ink">Accent color</label>
            <div class="flex items-center gap-2">
              <input id="sig-accent" v-model="accentColor" type="color" class="h-11 w-14 cursor-pointer rounded-sm border-2 border-line-strong bg-solid p-1" />
              <span class="font-mono text-sm text-ink-mid">{{ accentColor }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="sig-text" class="text-sm font-semibold text-ink">Text color</label>
            <div class="flex items-center gap-2">
              <input id="sig-text" v-model="textColor" type="color" class="h-11 w-14 cursor-pointer rounded-sm border-2 border-line-strong bg-solid p-1" />
              <span class="font-mono text-sm text-ink-mid">{{ textColor }}</span>
            </div>
          </div>
        </div>
        <UiSelect v-model="fontFamily" label="Font" :options="FONT_OPTIONS" />
      </section>
    </div>

    <!-- Preview + output -->
    <div class="flex min-w-0 flex-col gap-5">
      <section class="surface p-5">
        <h2 class="text-sm font-bold uppercase tracking-wide text-ink">Preview</h2>
        <p class="mt-1 text-sm text-ink-faint">Shown on white, the way most email clients render it.</p>
        <div class="mt-3 overflow-x-auto rounded-sm border-2 border-line-strong bg-white p-5">
          <!-- eslint-disable-next-line vue/no-v-html : markup is built locally from escaped inputs -->
          <div v-html="signatureHtml" />
        </div>
        <UiButton class="mt-4 w-full" @click="copyRich">
          <component :is="copiedRich ? Check : Copy" class="size-4" aria-hidden="true" />
          {{ copiedRich ? 'Copied' : 'Copy signature (paste into Gmail or Outlook)' }}
        </UiButton>
      </section>

      <section class="surface p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-bold uppercase tracking-wide text-ink">HTML code</h2>
          <UiButton size="sm" variant="secondary" @click="copyHtml">
            <component :is="copiedHtml ? Check : Copy" class="size-4" aria-hidden="true" />
            {{ copiedHtml ? 'Copied' : 'Copy all' }}
          </UiButton>
        </div>
        <pre class="mt-3 max-h-80 overflow-auto rounded-sm border-2 border-line-strong bg-solid p-3.5 font-mono text-xs leading-relaxed text-ink-mid"><code>{{ signatureHtml }}</code></pre>
      </section>
    </div>
  </div>
</template>
