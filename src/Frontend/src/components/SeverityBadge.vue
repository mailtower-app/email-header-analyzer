<script setup lang="ts">
import { computed } from 'vue';
import type { Severity } from 'src/helpers/analysis';

interface Props {
  severity: Severity;
  label?: string;
  size?: 'sm' | 'md';
}

const props = withDefaults(defineProps<Props>(), { size: 'md' });

const text = computed(() => props.label ?? props.severity);
</script>

<template>
  <span class="sev-badge" :class="[`is-${severity}`, `size-${size}`]">
    <span class="sev-dot" aria-hidden="true" />
    {{ text }}
  </span>
</template>

<style scoped>
.sev-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.size-md {
  font-size: 0.74rem;
  padding: 0.22rem 0.55rem;
}

.size-sm {
  font-size: 0.66rem;
  padding: 0.12rem 0.4rem;
}

.sev-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.is-pass {
  color: var(--pass);
  background: var(--pass-bg);
  border-color: color-mix(in srgb, var(--pass) 30%, transparent);
}

.is-info {
  color: var(--info);
  background: var(--info-bg);
  border-color: color-mix(in srgb, var(--info) 30%, transparent);
}

.is-warn {
  color: var(--warn);
  background: var(--warn-bg);
  border-color: color-mix(in srgb, var(--warn) 30%, transparent);
}

.is-fail {
  color: var(--fail);
  background: var(--fail-bg);
  border-color: color-mix(in srgb, var(--fail) 30%, transparent);
}
</style>
