<script setup lang="ts">
import { computed } from 'vue';
import type { AnalysisResult, Severity } from 'src/helpers/analysis';

interface Props {
  result: AnalysisResult;
}

const props = defineProps<Props>();

interface Verdict {
  risk: string;
  headline: string;
}

const VERDICTS: Record<Severity, Verdict> = {
  fail: { risk: 'At risk', headline: 'This message failed authentication' },
  warn: { risk: 'Attention', headline: 'Some signals need a closer look' },
  info: { risk: 'Clear', headline: 'No authentication failures — a few notes below' },
  pass: { risk: 'Clear', headline: 'No authentication failures detected' },
};

const verdict = computed<Verdict>(() => VERDICTS[props.result.worst]);

const chips = computed(() => {
  const { fail, warn, pass, info } = props.result.counts;
  const list: Array<{ key: string; n: number; label: string }> = [
    { key: 'fail', n: fail, label: 'failed' },
    { key: 'warn', n: warn, label: 'warnings' },
    { key: 'info', n: info, label: 'notes' },
    { key: 'pass', n: pass, label: 'passed' },
  ];
  return list.filter((c) => c.n > 0);
});
</script>

<template>
  <div class="verdict-bar" :class="`worst-${result.worst}`" role="status">
    <div class="headline">
      <span class="risk">{{ verdict.risk }}</span>
      <span class="headline-text">{{ verdict.headline }}</span>
    </div>

    <div v-if="chips.length" class="counts">
      <a
        v-for="chip in chips"
        :key="chip.key"
        :href="chip.key === 'pass' ? '#mail-authentication' : '#mail-findings'"
        class="count"
        :class="`c-${chip.key}`"
      >
        <span class="n">{{ chip.n }}</span> {{ chip.label }}
      </a>
    </div>
  </div>
</template>

<style scoped>
.verdict-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  background: var(--raised);
  border: 1px solid var(--border);
  border-left: 4px solid var(--border-strong);
  border-radius: var(--radius);
  padding: 1rem 1.2rem;
  box-shadow: var(--shadow);
}

.verdict-bar.worst-fail {
  border-left-color: var(--fail);
}
.verdict-bar.worst-warn {
  border-left-color: var(--warn);
}
.verdict-bar.worst-info {
  border-left-color: var(--info);
}
.verdict-bar.worst-pass {
  border-left-color: var(--pass);
}

.headline {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: 600;
  color: var(--ink);
}

.risk {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  background: var(--panel-2);
  color: var(--ink-muted);
}

.worst-fail .risk {
  background: var(--fail-bg);
  color: var(--fail);
}
.worst-warn .risk {
  background: var(--warn-bg);
  color: var(--warn);
}
.worst-info .risk {
  background: var(--info-bg);
  color: var(--info);
}
.worst-pass .risk {
  background: var(--pass-bg);
  color: var(--pass);
}

.headline-text {
  line-height: 1.3;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem;
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

.count {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink-muted);
  text-decoration: none;
  font-variant-numeric: tabular-nums;
}

.count:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.count .n {
  font-weight: 600;
}

.c-fail {
  color: var(--fail);
}
.c-warn {
  color: var(--warn);
}
.c-pass {
  color: var(--pass);
}
</style>
