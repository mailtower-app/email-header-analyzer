<script setup lang="ts">
import { computed } from 'vue';

import { authenticationHelper } from '@/helpers/authenticationHelper';
import type { AuthenticationSummary } from '@/helpers/authenticationHelper';

import CollapsibleCard from '@/components/CollapsibleCard.vue';

interface Props {
  summary: AuthenticationSummary;
  /** How many "Authentication-Results" headers the email has */
  headerCount: number;
}

const props = defineProps<Props>();

const checks = computed(() => {
  const { spf, dkim, dmarc } = props.summary;
  const spfState = authenticationHelper.getCheckState(spf);
  const dkimState = authenticationHelper.getCheckState(dkim);
  const dmarcState = authenticationHelper.getCheckState(dmarc);

  return [
    {
      title: 'SPF · sending server',
      state: spfState,
      status: spf?.status,
      explanation: {
        passed: 'The sender domain lists this server as one that may send its email.',
        failed: 'The sender domain does not list this server as one that may send its email.',
        unknown: 'The receiving server recorded no clear result about the sending server.',
      }[spfState],
      rows: [
        { name: 'Checked', value: spf?.domain },
        { name: 'Server', value: spf?.ipAddress },
      ],
    },
    {
      title: 'DKIM · signature',
      state: dkimState,
      status: dkim?.status,
      explanation: {
        passed: 'The email was signed by the domain below and was not changed on the way.',
        failed: 'The signature does not fit the email. It was changed on the way or it is a fake.',
        unknown: 'The email has no signature that the receiving server could check.',
      }[dkimState],
      rows: [
        { name: 'Domain', value: dkim?.domain },
        { name: 'Selector', value: dkim?.selector },
      ],
    },
    {
      title: 'DMARC · sender domain',
      state: dmarcState,
      status: dmarc?.status,
      explanation: {
        passed: 'The visible sender matches the domain that passed SPF or DKIM.',
        failed: 'The visible sender does not match a domain that passed SPF or DKIM.',
        unknown: 'The receiving server recorded no clear result about the visible sender.',
      }[dmarcState],
      rows: [
        { name: 'From', value: dmarc?.domain },
        { name: 'Policy', value: dmarc?.policy ? `p=${dmarc.policy}` : undefined },
      ],
    },
  ].map((check) => ({ ...check, rows: check.rows.filter((row) => row.value) }));
});
</script>

<template>
  <CollapsibleCard title="Authentication in detail">
    <template #hint>
      <template v-if="summary.checkedBy">
        Checked by {{ summary.checkedBy }}, the server that received the email.
      </template>
      <template v-else>Checked by the server that received the email.</template>
      <template v-if="headerCount > 1">
        The email has {{ headerCount }} result headers, this is the newest one.
      </template>
    </template>

    <div class="authentication-grid">
      <div v-for="check in checks" :key="check.title">
        <h3 class="authentication-title">{{ check.title }}</h3>
        <p class="authentication-text">{{ check.explanation }}</p>
        <dl class="authentication-rows">
          <dt>Result</dt>
          <dd class="authentication-result" :class="`is-${check.state}`">
            {{ check.status ?? 'no result' }}
          </dd>
          <template v-for="row in check.rows" :key="row.name">
            <dt>{{ row.name }}</dt>
            <dd class="eha-mono">{{ row.value }}</dd>
          </template>
        </dl>
      </div>
    </div>
  </CollapsibleCard>
</template>

<style scoped>
.authentication-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 4px;
}

.authentication-title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.authentication-text {
  margin: 0 0 10px;
  color: var(--eha-ink-soft);
  font-size: 14px;
}

.authentication-rows {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  row-gap: 6px;
  margin: 0;
  font-size: 13px;
}

.authentication-rows dt {
  color: var(--eha-muted);
}

.authentication-rows dd {
  margin: 0;
}

.authentication-result {
  font-weight: 600;
}

.authentication-result.is-passed {
  color: var(--eha-passed);
}

.authentication-result.is-failed {
  color: var(--eha-failed);
}
</style>
