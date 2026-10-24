<script setup lang="ts">
import { computed } from 'vue'
import type { Contributor } from '../../services/github/types'

const props = defineProps<{ contributors: Contributor[] | null; owner: string }>()
const me = computed(() => props.contributors?.find((c) => c.login.toLowerCase() === props.owner.toLowerCase()) ?? null)
const others = computed(() => props.contributors?.filter((c) => c.login.toLowerCase() !== props.owner.toLowerCase()) ?? [])
const shown = computed(() => [...(me.value ? [me.value] : []), ...others.value].slice(0, 5))
const label = computed(() => {
  if (!props.contributors) return ''
  const mine = me.value ? `${me.value.commits} commit${me.value.commits === 1 ? '' : 's'} by me` : 'No commits by me'
  if (!others.value.length) return `Solo · ${mine}`
  const names = others.value.slice(0, 2).map((c) => `@${c.login}`).join(', ')
  const more = others.value.length > 2 ? ` +${others.value.length - 2}` : ''
  return `${mine} · with ${names}${more}`
})
</script>

<template>
  <span v-if="contributors && contributors.length" class="stack" :title="contributors.map((c) => `@${c.login}: ${c.commits} commits`).join('\n')">
    <span class="faces">
      <img
        v-for="c in shown"
        :key="c.login"
        :src="c.avatarUrl ? `${c.avatarUrl}${c.avatarUrl.includes('?') ? '&' : '?'}s=48` : `https://github.com/${c.login}.png?size=48`"
        :alt="`@${c.login}`"
        width="22"
        height="22"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
    </span>
    <span class="txt">{{ label }}</span>
  </span>
</template>

<style scoped>
.stack {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  font-size: 13px;
  color: var(--muted);
}
.faces {
  display: flex;
  flex: none;
}
.faces img {
  width: 22px;
  height: 22px;
  margin-left: -6px;
  border: 2px solid var(--edge);
  background: var(--slot-bg);
  image-rendering: auto;
}
.faces img:first-child {
  margin-left: 0;
}
.txt {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
