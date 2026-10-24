<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import SectionHeader from '../ui/SectionHeader.vue'
import PixelIcon from '../ui/PixelIcon.vue'
import { site } from '../../config/site'
import { useGithub } from '../../composables/useGithub'
import { safeUrl } from '../../services/safe'

const { data, profileUrl } = useGithub()
const endpoint = safeUrl(site.contact.formEndpoint)
const mountedAt = Date.now()

const email = computed(() => site.contact.email || (site.contact.showGithubEmail ? data.value?.profile.email ?? '' : ''))
const links = computed(() => {
  const out: { label: string; url: string; icon: string; sub: string }[] = []
  if (email.value) out.push({ label: 'Email', url: `mailto:${email.value}`, icon: 'envelope', sub: email.value })
  if (profileUrl.value) out.push({ label: 'GitHub', url: profileUrl.value, icon: 'code', sub: profileUrl.value.replace(/^https:\/\//, '') })
  for (const l of site.contact.links) {
    const url = safeUrl(l.url, true)
    if (url) out.push({ label: l.label, url, icon: 'link', sub: url.replace(/^https?:\/\//, '').replace(/\/$/, '') })
  }
  const blog = safeUrl(data.value?.profile.blog)
  if (blog && !out.some((o) => o.url === blog)) out.push({ label: 'Website', url: blog, icon: 'compass', sub: blog.replace(/^https?:\/\//, '').replace(/\/$/, '') })
  const tw = data.value?.profile.twitter
  if (tw && !site.contact.links.some((l) => /x\.com|twitter\.com/.test(l.url))) out.push({ label: 'X / Twitter', url: `https://x.com/${encodeURIComponent(tw)}`, icon: 'link', sub: `@${tw}` })
  return out
})

const form = reactive({ name: '', email: '', message: '', company: '' })
const errors = reactive<Record<string, string>>({})
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const serverError = ref('')

function validate() {
  for (const k of Object.keys(errors)) delete errors[k]
  const name = form.name.trim()
  const mail = form.email.trim()
  const msg = form.message.trim()
  if (name.length < 2) errors.name = 'Please enter your name.'
  else if (name.length > 80) errors.name = 'Name must be 80 characters or fewer.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) errors.email = 'Please enter a valid email address.'
  if (msg.length < 10) errors.message = 'Message should be at least 10 characters.'
  else if (msg.length > 4000) errors.message = 'Message must be 4000 characters or fewer.'
  return Object.keys(errors).length === 0
}

async function submit() {
  serverError.value = ''
  if (!validate()) {
    const first = document.querySelector<HTMLElement>('#contact [aria-invalid="true"]')
    first?.focus()
    return
  }
  if (form.company || Date.now() - mountedAt < 2500) {
    status.value = 'error'
    serverError.value = 'Your message could not be sent. Please try again in a moment.'
    return
  }
  if (!endpoint) {
    if (!email.value) return
    const body = encodeURIComponent(`${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`)
    window.location.href = `mailto:${email.value}?subject=${encodeURIComponent(`Portfolio contact from ${form.name.trim()}`)}&body=${body}`
    return
  }
  status.value = 'sending'
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        _subject: `Portfolio message from ${form.name.trim()}`,
        _replyto: form.email.trim(),
        _template: 'table',
        _captcha: 'false',
        _honey: form.company,
        _gotcha: form.company,
      }),
    })
    let payload: any = null
    try {
      payload = await res.json()
    } catch {
      payload = null
    }
    const refused = payload && (payload.success === false || payload.success === 'false' || payload.ok === false)
    if (!res.ok || refused) {
      const msg = typeof payload?.message === 'string' ? payload.message : typeof payload?.error === 'string' ? payload.error : Array.isArray(payload?.errors) ? payload.errors.map((e: any) => e?.message).filter(Boolean).join(' ') : ''
      throw new Error(res.status === 429 ? 'Too many messages were sent. Please wait a few minutes and try again.' : msg.slice(0, 240) || 'The server could not accept your message.')
    }
    status.value = 'sent'
    form.name = ''
    form.email = ''
    form.message = ''
  } catch (e) {
    status.value = 'error'
    serverError.value = e instanceof Error && e.message !== 'Failed to fetch' ? e.message : 'Network error. Check your connection and try again.'
  }
}
</script>

<template>
  <section id="contact" class="section" aria-labelledby="contact-title" data-section="contact">
    <div class="wrap">
      <SectionHeader id="contact-title" kicker="Final chapter · The portal" title="Contact me" icon="envelope" lead="Have a project, a role or a question? Step through the portal." />
      <div class="grid">
        <div v-reveal class="panel panel-pad links">
          <h3 class="pixel">Find me</h3>
          <ul>
            <li v-for="l in links" :key="l.url">
              <a :href="l.url" :target="l.url.startsWith('mailto:') ? undefined : '_blank'" rel="noopener noreferrer" v-tilt="{ max: 6, lift: 2 }" class="link slot">
                <PixelIcon :name="l.icon" :size="22" />
                <span>
                  <strong>{{ l.label }}</strong>
                  <span class="sub">{{ l.sub }}</span>
                </span>
              </a>
            </li>
          </ul>
          <p v-if="!links.length" class="muted">Contact links will appear here once configured.</p>
        </div>

        <form v-if="endpoint || email" v-reveal class="panel panel-pad form" novalidate @submit.prevent="submit">
          <h3 class="pixel">Send a message</h3>
          <div class="field">
            <label for="cf-name">Name</label>
            <input id="cf-name" v-model="form.name" class="input" name="name" autocomplete="name" :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'cf-name-err' : undefined" maxlength="80" required />
            <p v-if="errors.name" id="cf-name-err" class="err">{{ errors.name }}</p>
          </div>
          <div class="field">
            <label for="cf-email">Email</label>
            <input id="cf-email" v-model="form.email" class="input" name="email" type="email" autocomplete="email" :aria-invalid="!!errors.email" :aria-describedby="errors.email ? 'cf-email-err' : undefined" maxlength="200" required />
            <p v-if="errors.email" id="cf-email-err" class="err">{{ errors.email }}</p>
          </div>
          <div class="field">
            <label for="cf-msg">Message</label>
            <textarea id="cf-msg" v-model="form.message" class="input" name="message" :aria-invalid="!!errors.message" :aria-describedby="errors.message ? 'cf-msg-err' : 'cf-msg-count'" maxlength="4000" required />
            <p v-if="errors.message" id="cf-msg-err" class="err">{{ errors.message }}</p>
            <p v-else id="cf-msg-count" class="dim small">{{ form.message.length }} / 4000</p>
          </div>
          <div class="hp" aria-hidden="true">
            <label for="cf-company">Company</label>
            <input id="cf-company" v-model="form.company" tabindex="-1" autocomplete="off" />
          </div>
          <div class="submit-row">
            <button type="submit" class="btn btn-primary" :disabled="status === 'sending'">
              <PixelIcon name="envelope" :size="18" />
              {{ status === 'sending' ? 'Sending…' : endpoint ? 'Send message' : 'Open in email app' }}
            </button>
            <p v-if="!endpoint" class="dim small">This opens your email app with the message filled in.</p>
          </div>
          <p v-if="status === 'sent'" class="ok" role="status">Message delivered. Thanks — I’ll get back to you soon.</p>
          <p class="dim small">Prefer your own email app? <a :href="`mailto:${email}`">{{ email }}</a></p>
          <p v-if="status === 'error'" class="err" role="alert">{{ serverError }}</p>
        </form>
        <div v-else class="panel panel-pad form">
          <h3 class="pixel">Send a message</h3>
          <p class="muted">The contact form isn’t connected yet. Reach out through the links on this page.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 18px;
}
h3 {
  margin: 0 0 14px;
  font-size: 17px;
  color: var(--heading);
}
.links ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  color: var(--text);
  text-decoration: none;
  transition: background 0.12s ease;
}
.link:hover {
  background: var(--hover);
}
.link > span {
  display: grid;
  min-width: 0;
}
.sub {
  font-size: 13px;
  color: var(--muted);
  overflow-wrap: anywhere;
}
.form {
  display: grid;
  gap: 14px;
}
.form h3 {
  margin-bottom: 0;
}
.err {
  margin: 0;
  color: #ff8a7a;
  font-size: 13.5px;
}
.ok {
  margin: 0;
  padding: 10px 12px;
  background: rgba(47, 220, 122, 0.12);
  border: 2px solid var(--emerald-deep);
  color: #b9ffd6;
}
.small {
  margin: 0;
  font-size: 12.5px;
}
.submit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.hp {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
