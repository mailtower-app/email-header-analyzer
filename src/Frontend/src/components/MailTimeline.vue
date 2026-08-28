<script setup lang="ts">
import { computed } from 'vue';

import type { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts';
import { ANALYSIS_CONFIG } from 'src/helpers/analysis';
import { formatUtc, formatDuration } from 'src/helpers/dateFormat';

interface Props {
  receivedHeaders: ReceivedHeaderParts[];
}

const props = defineProps<Props>();

function isValidDate(d: Date | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

interface HopRow {
  hop: ReceivedHeaderParts;
  index: number;
  byLabel: string;
  fromLabel: string;
  transport: string;
  timestamp: string;
  delaySeconds: number | undefined;
  delayLabel: string;
  delayIsLong: boolean;
  flag: string | undefined;
}

const rows = computed<HopRow[]>(() => {
  const list = props.receivedHeaders;

  return list.map((hop, index) => {
    const prev = index > 0 ? list[index - 1] : undefined;
    const currDate = hop.dateTime;
    const prevDate = prev?.dateTime;

    let delaySeconds: number | undefined;
    if (isValidDate(currDate) && isValidDate(prevDate)) {
      delaySeconds = (currDate.getTime() - prevDate.getTime()) / 1000;
    }

    const delayIsLong =
      delaySeconds !== undefined && delaySeconds > ANALYSIS_CONFIG.hopDelayWarnSeconds;

    let delayLabel = '';
    if (index === 0) {
      delayLabel = 'origin';
    } else if (delaySeconds === undefined) {
      delayLabel = 'no time';
    } else {
      delayLabel = `+${formatDuration(delaySeconds)}`;
    }

    let flag: string | undefined;
    if (index > 0 && delaySeconds === undefined) {
      flag = 'Missing or unreadable timestamp — transit time unknown across this hop.';
    } else if (delayIsLong) {
      flag = `Unusual dwell time (${formatDuration(delaySeconds!)}) — mail normally moves between servers in under a minute.`;
    } else if (delaySeconds !== undefined && delaySeconds < -ANALYSIS_CONFIG.clockSkewInfoSeconds) {
      flag = `Timestamp is ${formatDuration(-delaySeconds)} earlier than the previous hop — a server clock is off.`;
    }

    const byLabel = hop.byDomain || hop.rawHeaderDetails.headerData;

    // parseReceivedHeader can hand back an fromIpAddress that already contains
    // the hostname (everything inside the parentheses). Avoid repeating it.
    const fromDomain = hop.fromDomain ?? '';
    const fromExtra = hop.fromIpAddress ?? '';
    const fromLabel =
      fromExtra && fromDomain && fromExtra.includes(fromDomain)
        ? fromExtra
        : [fromDomain, fromExtra].filter(Boolean).join(' ');

    return {
      hop,
      index,
      byLabel,
      fromLabel,
      transport: hop.with?.trim() ?? '',
      timestamp: formatUtc(currDate),
      delaySeconds,
      delayLabel,
      delayIsLong,
      flag,
    };
  });
});
</script>

<template>
  <ol class="timeline">
    <li v-for="row in rows" :key="row.index" class="hop" :class="{ flagged: row.flag }">
      <div class="rail">
        <span class="node">{{ row.index + 1 }}</span>
        <span class="line" aria-hidden="true" />
      </div>

      <div class="body">
        <div class="by">{{ row.byLabel }}</div>
        <div v-if="row.fromLabel" class="from">from {{ row.fromLabel }}</div>

        <div class="meta">
          <span v-if="row.timestamp" class="ts">{{ row.timestamp }} UTC</span>
          <span
            class="delay"
            :class="{ long: row.delayIsLong, muted: row.index === 0 || row.delaySeconds === undefined }"
          >
            {{ row.delayLabel }}
          </span>
          <span v-if="row.transport" class="transport">{{ row.transport }}</span>
        </div>

        <p v-if="row.flag" class="flag-note">
          <span aria-hidden="true">&#9651;</span> {{ row.flag }}
        </p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.hop {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
}

.rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.node {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ink-muted);
  background: var(--panel);
  border: 2px solid var(--border-strong);
}

.hop.flagged .node {
  border-color: var(--warn);
  color: var(--warn);
  background: var(--warn-bg);
}

.line {
  width: 2px;
  flex: 1;
  min-height: 1rem;
  background: var(--border);
}

.hop:last-child .line {
  display: none;
}

.body {
  padding-bottom: 1.4rem;
  min-width: 0;
}

.by {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ink);
  word-break: break-all;
}

.from {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--ink-muted);
  word-break: break-all;
  margin-top: 0.1rem;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.4rem;
}

.ts {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.delay {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 5px;
  background: var(--panel-2);
  color: var(--ink-muted);
  border: 1px solid var(--border);
}

.delay.muted {
  color: var(--ink-faint);
}

.delay.long {
  background: var(--warn-bg);
  color: var(--warn);
  border-color: color-mix(in srgb, var(--warn) 35%, transparent);
}

.transport {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--ink-faint);
}

.flag-note {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
  color: var(--warn);
  display: flex;
  gap: 0.4rem;
  align-items: baseline;
}
</style>
