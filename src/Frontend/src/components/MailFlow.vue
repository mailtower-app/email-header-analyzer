<script setup lang="ts">
import { computed, ref } from 'vue';

import type { ReceivedHeaderParts } from '@/models/ReceivedHeaderParts';

import { authenticationHelper } from '@/helpers/authenticationHelper';
import type { AuthenticationCheck } from '@/helpers/authenticationHelper';
import { formatHelper } from '@/helpers/formatHelper';
import { routeHelper } from '@/helpers/routeHelper';

import MailFlowTable from '@/components/MailFlowTable.vue';

interface Props {
  receivedHeaders: ReceivedHeaderParts[];
  /** The spf result, to mark the server that was not allowed to send */
  spf?: AuthenticationCheck | undefined;
}

const props = defineProps<Props>();

const showTechnicalDetails = ref(false);

const delayClasses = {
  normal: '',
  slow: 'eha-slow',
  'very-slow': 'eha-failed',
};

const delayTexts = {
  normal: '',
  slow: ' · slow',
  'very-slow': ' · very slow',
};

const hops = computed(() => {
  const spfFailed = authenticationHelper.getCheckState(props.spf) === 'failed';
  const spfDomain = props.spf?.domain?.split('@').pop();

  return props.receivedHeaders.map((received, index) => {
    const delayInSeconds = routeHelper.getDelayInSeconds(
      props.receivedHeaders[index - 1],
      received,
    );
    const delayLevel = routeHelper.getDelayLevel(delayInSeconds);

    const notAllowed =
      spfFailed && !!props.spf?.ipAddress && props.spf.ipAddress === received.fromIpAddress;

    return {
      received,
      number: index + 1,
      isLast: index === props.receivedHeaders.length - 1,
      host: received.byDomain || 'Unknown server',
      rawHeader: received.byDomain ? undefined : received.rawHeaderDetails.headerData,
      time: formatHelper.formatTime(received.dateTime),
      description: routeHelper.describeHop(received),
      notAllowedBy: notAllowed ? (spfDomain ?? 'the sender domain') : undefined,
      delay:
        index === 0
          ? undefined
          : {
              text:
                delayInSeconds === undefined
                  ? 'unknown'
                  : formatHelper.formatDuration(delayInSeconds) + delayTexts[delayLevel],
              class: delayClasses[delayLevel],
            },
    };
  });
});
</script>

<template>
  <section class="eha-card" aria-labelledby="route-title">
    <div class="route-header">
      <div>
        <h2 id="route-title" class="eha-card-title">Route</h2>
        <p class="eha-card-hint">From the sender at the top to your mailbox at the bottom.</p>
      </div>
      <span class="eha-card-hint">Times in UTC</span>
    </div>

    <p v-if="hops.length === 0" class="eha-muted q-mb-none">
      This header has no "Received" fields, the route is unknown.
    </p>

    <ol class="route-list">
      <template v-for="hop in hops" :key="hop.number">
        <li v-if="hop.delay" class="route-row" aria-label="Delay">
          <div class="route-rail"><span class="route-line"></span></div>
          <div class="route-delay">
            <span class="eha-pill" :class="hop.delay.class">
              <q-icon name="south" size="13px" aria-hidden="true" />
              {{ hop.delay.text }}
            </span>
          </div>
        </li>

        <li class="route-row">
          <div class="route-rail">
            <span class="route-number">{{ hop.number }}</span>
            <span v-if="!hop.isLast" class="route-line"></span>
          </div>
          <div class="route-hop">
            <div class="route-hop-header">
              <span class="route-host">{{ hop.host }}</span>
              <span v-if="hop.time" class="eha-mono eha-muted route-time">{{ hop.time }}</span>
            </div>
            <div v-if="hop.received.byIpAddress" class="eha-mono eha-muted">
              {{ hop.received.byIpAddress }}
            </div>
            <div v-if="hop.rawHeader" class="eha-mono eha-muted">{{ hop.rawHeader }}</div>
            <div v-if="hop.received.fromDomain" class="route-from">
              received from {{ hop.received.fromDomain }}
              <template v-if="hop.received.fromIpAddress">
                · <span class="eha-mono">{{ hop.received.fromIpAddress }}</span>
              </template>
            </div>
            <div v-else-if="hop.received.byDomain" class="route-from">internal handover</div>
            <div class="route-chips">
              <span v-if="hop.description.protocol" class="eha-chip">
                {{ hop.description.protocol }}
              </span>
              <span v-if="hop.description.encryption" class="eha-chip">
                {{ hop.description.encryption }}
              </span>
              <span v-if="hop.description.authenticated" class="eha-chip">Sender logged in</span>
              <span v-if="hop.notAllowedBy" class="eha-chip eha-failed route-chip-strong">
                Not allowed by {{ hop.notAllowedBy }}
              </span>
            </div>
          </div>
        </li>
      </template>
    </ol>

    <div v-if="hops.length > 0" class="route-footer">
      <button
        type="button"
        class="eha-button-link"
        :aria-expanded="showTechnicalDetails"
        @click="showTechnicalDetails = !showTechnicalDetails"
      >
        {{ showTechnicalDetails ? 'Hide' : 'Show' }} technical details (Id, For, Via)
      </button>
      <MailFlowTable v-if="showTechnicalDetails" :received-headers="receivedHeaders" />
    </div>
  </section>
</template>

<style scoped>
.route-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.route-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.route-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  column-gap: 14px;
}

.route-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.route-number {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--eha-ink);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
}

.route-line {
  flex: 1;
  width: 2px;
  background: #cfd5df;
}

.route-delay {
  padding: 6px 0 14px;
}

.route-hop {
  min-width: 0;
  padding-bottom: 8px;
}

.route-hop-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 12px;
}

.route-host {
  font-size: 16px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.route-time {
  white-space: nowrap;
}

.route-from {
  color: var(--eha-muted);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.route-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.route-chip-strong {
  font-weight: 600;
}

.route-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--eha-line-soft);
}

@media (max-width: 599px) {
  .route-row {
    grid-template-columns: 32px minmax(0, 1fr);
    column-gap: 12px;
  }

  .route-number {
    width: 28px;
    height: 28px;
    font-size: 13px;
  }

  .route-host {
    font-size: 15px;
  }
}
</style>
