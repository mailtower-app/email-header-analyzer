<script setup lang="ts">
import { computed } from 'vue';
import type { Finding } from 'src/helpers/analysis';

interface Props {
  finding: Finding;
}

const props = defineProps<Props>();

const GLYPH: Record<Finding['severity'], string> = {
  fail: '!',
  warn: '△', // triangle
  info: 'i',
  pass: '✓', // check
};

const glyph = computed(() => GLYPH[props.finding.severity]);
const openByDefault = computed(() => props.finding.severity === 'fail');
</script>

<template>
  <details class="finding" :class="`is-${finding.severity}`" :open="openByDefault">
    <summary>
      <span class="fic" aria-hidden="true">{{ glyph }}</span>
      <span class="ftext">
        <span class="ft">{{ finding.title }}</span>
        <span class="fd">{{ finding.description }}</span>
      </span>
      <span class="chev" aria-hidden="true">&#9656;</span>
    </summary>

    <div v-if="finding.evidence" class="detail">
      <pre class="evidence">{{ finding.evidence }}</pre>
    </div>
  </details>
</template>

<style scoped>
.finding {
  border: 1px solid var(--border);
  border-left: 4px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--panel);
  overflow: hidden;
}

.finding.is-fail {
  border-left-color: var(--fail);
}
.finding.is-warn {
  border-left-color: var(--warn);
}
.finding.is-info {
  border-left-color: var(--info);
}

summary {
  list-style: none;
  cursor: pointer;
  padding: 0.9rem 1.05rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: start;
}

summary::-webkit-details-marker {
  display: none;
}

.fic {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--panel-2);
  color: var(--ink-muted);
}

.is-fail .fic {
  background: var(--fail-bg);
  color: var(--fail);
}
.is-warn .fic {
  background: var(--warn-bg);
  color: var(--warn);
}
.is-info .fic {
  background: var(--info-bg);
  color: var(--info);
}

.ftext {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.ft {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--ink);
}

.fd {
  font-size: 0.87rem;
  color: var(--ink-muted);
}

.chev {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--ink-faint);
  transition: transform 0.15s ease;
}

.finding[open] .chev {
  transform: rotate(90deg);
}

.detail {
  padding: 0 1.05rem 1rem 3.5rem;
}

.evidence {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.7;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 7px;
  padding: 0.65rem 0.8rem;
  overflow-x: auto;
  white-space: pre;
  color: var(--ink);
}

@media (prefers-reduced-motion: no-preference) {
  .finding[open] {
    animation: findIn 0.24s ease;
  }
  .chev {
    transition: transform 0.15s ease;
  }
}

@keyframes findIn {
  from {
    opacity: 0.5;
    transform: translateY(3px);
  }
}
</style>
