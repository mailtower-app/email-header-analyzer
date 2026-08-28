<script setup lang="ts">
import { computed } from 'vue';
import type { Severity } from 'src/helpers/analysis';

export interface AuthRow {
  label: string;
  value?: string | undefined;
}

interface Props {
  kind: string;
  status?: string | undefined;
  rows: AuthRow[];
  severity: Severity;
}

const props = defineProps<Props>();

const GLYPH: Record<Severity, string> = {
  pass: '✓',
  info: 'i',
  warn: '?',
  fail: '✕',
};

const glyph = computed(() => GLYPH[props.severity]);
const visibleRows = computed(() => props.rows.filter((r) => r.value && r.value.trim().length > 0));
</script>

<template>
  <div class="auth" :class="`is-${severity}`">
    <div class="auth-top">
      <span class="ring" aria-hidden="true">{{ glyph }}</span>
      <h4>{{ kind }}</h4>
      <span v-if="status" class="status">{{ status }}</span>
    </div>

    <dl v-if="visibleRows.length" class="rows">
      <template v-for="row in visibleRows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
  </div>
</template>

<style scoped>
.auth {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel);
  padding: 1.05rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  height: 100%;
}

.auth.is-fail {
  border-color: color-mix(in srgb, var(--fail) 45%, transparent);
  background: var(--fail-bg);
}
.auth.is-warn {
  border-color: color-mix(in srgb, var(--warn) 40%, transparent);
}

.auth-top {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.ring {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 700;
  border: 2px solid var(--pass);
  color: var(--pass);
  background: var(--pass-bg);
}

.is-fail .ring {
  border-color: var(--fail);
  color: var(--fail);
  background: color-mix(in srgb, var(--fail) 16%, transparent);
}
.is-warn .ring {
  border-color: var(--warn);
  color: var(--warn);
  background: var(--warn-bg);
}
.is-info .ring {
  border-color: var(--info);
  color: var(--info);
  background: var(--info-bg);
}

h4 {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--ink);
}

.status {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-muted);
}

.rows {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 0.6rem;
  margin: 0;
  font-size: 0.82rem;
}

.rows dt {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: 0.76rem;
}

.rows dd {
  margin: 0;
  font-family: var(--font-mono);
  color: var(--ink);
  word-break: break-all;
}

@media (prefers-reduced-motion: no-preference) {
  .auth.is-fail {
    animation: authPulse 1.6s ease 1;
  }
}

@keyframes authPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  30% {
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--fail) 22%, transparent);
  }
}
</style>
