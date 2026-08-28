<script setup lang="ts">
import { computed } from 'vue';
import type { AnalysisResult, Finding, Severity } from 'src/helpers/analysis';

import FindingCard from 'src/components/FindingCard.vue';

interface Props {
  result: AnalysisResult;
}

const props = defineProps<Props>();

const GROUPS: Array<{ severity: Exclude<Severity, 'pass'>; heading: string }> = [
  { severity: 'fail', heading: 'Failures' },
  { severity: 'warn', heading: 'Warnings' },
  { severity: 'info', heading: 'Notes' },
];

const groups = computed(() =>
  GROUPS.map((g) => ({
    ...g,
    items: props.result.findings.filter((f: Finding) => f.severity === g.severity),
  })).filter((g) => g.items.length > 0),
);

const hasIssues = computed(() => groups.value.length > 0);
const passed = computed(() => props.result.counts.pass);
</script>

<template>
  <section v-if="hasIssues" id="mail-findings" class="findings-panel">
    <div v-for="group in groups" :key="group.severity" class="group">
      <h3 class="group-heading">
        <span class="dot" :class="`d-${group.severity}`" aria-hidden="true" />
        {{ group.heading }}
        <span class="group-count">{{ group.items.length }}</span>
      </h3>
      <div class="group-list">
        <FindingCard v-for="finding in group.items" :key="finding.id" :finding="finding" />
      </div>
    </div>

    <p v-if="passed > 0" class="passed-note">
      {{ passed }} check{{ passed === 1 ? '' : 's' }} passed.
    </p>
  </section>
</template>

<style scoped>
.findings-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.group-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.d-fail {
  background: var(--fail);
}
.d-warn {
  background: var(--warn);
}
.d-info {
  background: var(--info);
}

.group-count {
  font-variant-numeric: tabular-nums;
  color: var(--ink-faint);
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (prefers-reduced-motion: no-preference) {
  .group-list > * {
    animation: cardIn 0.28s var(--ease-out, ease) both;
  }
  .group-list > *:nth-child(2) {
    animation-delay: 0.05s;
  }
  .group-list > *:nth-child(3) {
    animation-delay: 0.1s;
  }
  .group-list > *:nth-child(4) {
    animation-delay: 0.15s;
  }
  .group-list > *:nth-child(n + 5) {
    animation-delay: 0.2s;
  }
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

.passed-note {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--pass);
}
</style>
