<script setup lang="ts">
import { ref } from 'vue';
import type { AlignHint } from 'src/helpers/analysis';

interface Props {
  label: string;
  value?: string | undefined;
  /** Render the value in the mono role. Off for prose like Subject. */
  mono?: boolean;
  align?: AlignHint | undefined;
}

const props = withDefaults(defineProps<Props>(), { mono: true });

const copied = ref(false);

async function copy(): Promise<void> {
  if (!props.value) return;
  try {
    await navigator.clipboard.writeText(props.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1200);
  } catch {
    // clipboard blocked — no-op
  }
}
</script>

<template>
  <div class="sum" :class="{ mismatch: align }">
    <div class="sk">
      {{ label }}
      <button
        v-if="value"
        type="button"
        class="copy"
        :aria-label="`Copy ${label}`"
        @click="copy"
      >
        {{ copied ? 'copied' : 'copy' }}
      </button>
    </div>

    <div class="sv" :class="{ mono, prose: !mono }">{{ value || '—' }}</div>

    <span v-if="align" class="align" :class="`is-${align.severity}`">
      <span class="dot" aria-hidden="true" />
      {{ align.text }}
    </span>
  </div>
</template>

<style scoped>
.sum {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel);
  padding: 0.8rem 0.95rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sum.mismatch {
  border-color: color-mix(in srgb, var(--warn) 40%, transparent);
}

.sk {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.copy {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-faint);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.05rem 0.35rem;
  cursor: pointer;
}

.copy:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.sv {
  color: var(--ink);
  font-size: 0.86rem;
  word-break: break-all;
}

.sv.mono {
  font-family: var(--font-mono);
}

.sv.prose {
  font-family: var(--font-sans);
  word-break: normal;
}

.align {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.align .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.align.is-warn {
  color: var(--warn);
  background: var(--warn-bg);
  border-color: color-mix(in srgb, var(--warn) 30%, transparent);
}

.align.is-info {
  color: var(--info);
  background: var(--info-bg);
  border-color: color-mix(in srgb, var(--info) 30%, transparent);
}

.align.is-fail {
  color: var(--fail);
  background: var(--fail-bg);
  border-color: color-mix(in srgb, var(--fail) 30%, transparent);
}

.align.is-pass {
  color: var(--pass);
  background: var(--pass-bg);
  border-color: color-mix(in srgb, var(--pass) 30%, transparent);
}
</style>
