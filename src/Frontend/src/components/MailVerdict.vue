<script setup lang="ts">
import { computed } from 'vue';

import type { ReceivedHeaderParts } from '@/models/ReceivedHeaderParts';

import { authenticationHelper } from '@/helpers/authenticationHelper';
import type { AuthenticationSummary, CheckState } from '@/helpers/authenticationHelper';
import { formatHelper } from '@/helpers/formatHelper';
import { routeHelper } from '@/helpers/routeHelper';

interface Props {
  summary: AuthenticationSummary;
  fromDomain?: string | undefined;
  receivedHeaders: ReceivedHeaderParts[];
}

const props = defineProps<Props>();

const icons: Record<CheckState, string> = {
  passed: 'check_circle_outline',
  failed: 'highlight_off',
  unknown: 'remove_circle_outline',
};

const verdict = computed(() => authenticationHelper.getVerdict(props.summary, props.fromDomain));

const verdictIcon = computed(() => {
  return verdict.value.level === 'failed' ? 'warning_amber' : icons[verdict.value.level];
});

const checks = computed(() => {
  const { spf, dkim, dmarc } = props.summary;
  const spfState = authenticationHelper.getCheckState(spf);
  const dkimState = authenticationHelper.getCheckState(dkim);
  const dmarcState = authenticationHelper.getCheckState(dmarc);

  const statusTexts: Record<CheckState, string> = {
    passed: 'Passed',
    failed: 'Failed',
    unknown: 'Not checked',
  };

  return [
    {
      label: 'SPF',
      state: spfState,
      status: statusTexts[spfState],
      description: {
        passed: 'Sending server is allowed',
        failed: 'Sending server is not allowed',
        unknown: 'No result for the sending server',
      }[spfState],
      detail: [spfState === 'failed' ? spf?.status : undefined, spf?.domain ?? spf?.ipAddress],
    },
    {
      label: 'DKIM',
      state: dkimState,
      status: dkim?.status === 'none' ? 'Not signed' : statusTexts[dkimState],
      description: {
        passed: 'Signature is valid',
        failed: 'Signature is not valid',
        unknown:
          dkim?.status === 'none' ? 'The email has no signature' : 'No result for a signature',
      }[dkimState],
      detail: [dkimState === 'failed' ? dkim?.status : undefined, dkim?.domain],
    },
    {
      label: 'DMARC',
      state: dmarcState,
      status: statusTexts[dmarcState],
      description: {
        passed: 'Sender domain matches',
        failed: 'Sender domain does not match',
        unknown: 'No result for the sender domain',
      }[dmarcState],
      detail: [dmarc?.domain, dmarc?.policy ? `policy ${dmarc.policy}` : undefined],
    },
  ].map((check) => ({
    ...check,
    icon: icons[check.state],
    detail: check.detail.filter((part) => part).join(' · '),
  }));
});

const delivery = computed(() => {
  const totalSeconds = routeHelper.getTotalSeconds(props.receivedHeaders);
  const level = routeHelper.getDelayLevel(totalSeconds);
  const count = props.receivedHeaders.length;
  const servers = `${count} ${count === 1 ? 'server' : 'servers'} on the way`;
  const firstDate = props.receivedHeaders.find((received) => received.dateTime)?.dateTime;

  return {
    duration: totalSeconds === undefined ? 'Unknown' : formatHelper.formatDuration(totalSeconds),
    isSlow: level !== 'normal',
    description: level === 'normal' ? servers : `Slow · ${servers}`,
    date: formatHelper.formatDateTime(firstDate),
  };
});

const deliveryText = computed(() => {
  const count = props.receivedHeaders.length;
  if (count === 0) {
    return '';
  }

  const servers = `${count} ${count === 1 ? 'server' : 'servers'}`;
  const totalSeconds = routeHelper.getTotalSeconds(props.receivedHeaders);

  return totalSeconds === undefined
    ? `It passed ${servers}.`
    : `Delivery took ${formatHelper.formatDuration(totalSeconds)} through ${servers}.`;
});
</script>

<template>
  <section class="eha-card verdict" aria-labelledby="verdict-title">
    <div class="verdict-summary">
      <div class="verdict-badge" :class="`is-${verdict.level}`">
        <q-icon :name="verdictIcon" size="20px" aria-hidden="true" />
        {{ verdict.badge }}
      </div>
      <h1 id="verdict-title" class="verdict-title">{{ verdict.title }}</h1>
      <p class="verdict-text">{{ verdict.text }} {{ deliveryText }}</p>
    </div>

    <div class="verdict-tiles">
      <div v-for="check in checks" :key="check.label" class="tile" :class="`is-${check.state}`">
        <div class="tile-header">
          <span class="tile-label">{{ check.label }}</span>
          <q-icon :name="check.icon" size="22px" aria-hidden="true" />
        </div>
        <div class="tile-status">{{ check.status }}</div>
        <div class="tile-description">{{ check.description }}</div>
        <div v-if="check.detail" class="tile-detail">{{ check.detail }}</div>
      </div>

      <div class="tile" :class="delivery.isSlow ? 'is-slow' : 'is-neutral'">
        <div class="tile-header">
          <span class="tile-label">DELIVERY</span>
          <q-icon name="schedule" size="22px" aria-hidden="true" />
        </div>
        <div class="tile-status">{{ delivery.duration }}</div>
        <div class="tile-description">{{ delivery.description }}</div>
        <div v-if="delivery.date" class="tile-detail">{{ delivery.date }}</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.verdict {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 32px;
  padding: 32px;
}

.verdict-summary {
  flex: 1 1 340px;
  min-width: 0;
}

.verdict-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 6px;
  border-radius: 999px;
  background: var(--eha-chip);
  color: var(--eha-ink-soft);
  font-size: 13px;
  font-weight: 600;
}

.verdict-badge.is-passed {
  background: var(--eha-passed-tint);
  color: var(--eha-passed);
}

.verdict-badge.is-failed {
  background: var(--eha-failed-tint);
  color: var(--eha-failed);
}

.verdict-title {
  margin: 14px 0 8px;
  color: var(--eha-ink);
  font-size: 36px !important;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.15 !important;
  overflow-wrap: anywhere;
}

.verdict-text {
  max-width: 46ch;
  margin: 0;
  color: var(--eha-muted);
  font-size: 16px;
}

.verdict-tiles {
  display: grid;
  flex: 1 1 480px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;
}

.tile {
  min-width: 0;
  padding: 16px;
  border: 1px solid var(--eha-line);
  border-radius: 12px;
  background: var(--eha-ground);
}

.tile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--eha-muted);
}

.tile-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.tile-status {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}

.tile-description {
  color: var(--eha-ink-soft);
  font-size: 13px;
}

.tile-detail {
  margin-top: 2px;
  color: var(--eha-muted);
  font-family: var(--eha-mono);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.tile.is-passed {
  border-color: var(--eha-passed-line);
  background: var(--eha-passed-ground);
}

.tile.is-passed .tile-header,
.tile.is-passed .tile-status {
  color: var(--eha-passed);
}

.tile.is-failed {
  border-color: var(--eha-failed-line);
  background: var(--eha-failed-ground);
}

.tile.is-failed .tile-header,
.tile.is-failed .tile-status {
  color: var(--eha-failed);
}

.tile.is-unknown {
  border: 1px dashed #aeb6c2;
}

.tile.is-unknown .tile-status {
  color: var(--eha-ink-soft);
}

.tile.is-slow {
  border-color: var(--eha-slow-line);
  background: var(--eha-slow-tint);
}

.tile.is-slow .tile-header,
.tile.is-slow .tile-status {
  color: var(--eha-slow);
}

@media (max-width: 599px) {
  .verdict {
    gap: 16px;
    padding: 20px;
  }

  .verdict-title {
    margin-top: 12px;
    font-size: 26px !important;
    line-height: 1.2 !important;
  }

  .verdict-text {
    font-size: 15px;
  }

  .verdict-tiles {
    gap: 10px;
  }

  .tile {
    padding: 12px;
  }

  .tile-status {
    margin-top: 4px;
    font-size: 19px;
  }

  .tile-description {
    font-size: 12px;
  }

  .tile-detail {
    display: none;
  }
}
</style>
