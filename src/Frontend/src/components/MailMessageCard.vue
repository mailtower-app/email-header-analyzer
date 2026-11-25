<script setup lang="ts">
import { computed } from 'vue';

import { formatHelper } from '@/helpers/formatHelper';
import { mailHelper } from '@/helpers/mailHelper';

interface Props {
  subject?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  replyTo?: string | undefined;
  date?: string | undefined;
  returnPath?: string | undefined;
  messageId?: string | undefined;
  /** The sender could not be confirmed, a different return path is a warning */
  senderNotConfirmed?: boolean;
}

const props = defineProps<Props>();

const fromAddresses = computed(() => mailHelper.parseMailAddresses(props.from));
const toAddresses = computed(() => mailHelper.parseMailAddresses(props.to));
const replyToAddresses = computed(() => mailHelper.parseMailAddresses(props.replyTo));
const returnPathAddress = computed(() => mailHelper.parseMailAddresses(props.returnPath)[0]);

const formattedDate = computed(() => {
  if (!props.date) {
    return undefined;
  }

  const date = new Date(props.date.replace(/\([^)]*\)/g, ' ').trim());
  return formatHelper.formatDateTime(date) || props.date;
});

const returnPathNote = computed(() => {
  const from = fromAddresses.value[0];
  const returnPath = returnPathAddress.value;

  if (!from?.domain || !returnPath?.domain) {
    return undefined;
  }

  if (from.address.toLowerCase() === returnPath.address.toLowerCase()) {
    return { same: true, text: 'same as From' };
  }

  if (mailHelper.isSameOrSubdomain(from.domain, returnPath.domain)) {
    return { same: true, text: 'same domain as From' };
  }

  return { same: false, fromDomain: from.domain, returnPathDomain: returnPath.domain };
});
</script>

<template>
  <section class="eha-card" aria-labelledby="message-title">
    <h2 id="message-title" class="eha-card-title">Message</h2>
    <p class="eha-card-hint message-hint">What the sender wrote on the email.</p>

    <dl class="eha-details">
      <template v-if="subject">
        <dt>Subject</dt>
        <dd class="text-weight-medium">{{ subject }}</dd>
      </template>

      <template v-if="fromAddresses.length > 0">
        <dt>From</dt>
        <dd>
          <div v-for="(address, index) in fromAddresses" :key="index">
            <div v-if="address.name">{{ address.name }}</div>
            <div class="eha-mono">{{ address.address }}</div>
          </div>
        </dd>
      </template>

      <template v-if="toAddresses.length > 0">
        <dt>To</dt>
        <dd>
          <div v-for="(address, index) in toAddresses" :key="index">
            <div v-if="address.name">{{ address.name }}</div>
            <div class="eha-mono">{{ address.address }}</div>
          </div>
        </dd>
      </template>

      <template v-if="replyToAddresses.length > 0">
        <dt>Reply-To</dt>
        <dd>
          <div v-for="(address, index) in replyToAddresses" :key="index" class="eha-mono">
            {{ address.address }}
          </div>
        </dd>
      </template>

      <template v-if="formattedDate">
        <dt>Date</dt>
        <dd>{{ formattedDate }}</dd>
      </template>
    </dl>

    <template v-if="returnPathAddress || messageId">
      <div class="message-divider"></div>
      <p class="eha-card-hint message-hint">What the mail servers used for delivery.</p>

      <dl class="eha-details">
        <template v-if="returnPathAddress">
          <dt>Return-Path</dt>
          <dd>
            <span class="eha-mono">{{ returnPathAddress.address || '(empty)' }}</span>
            <span v-if="returnPathNote?.same" class="eha-pill eha-passed message-same">
              {{ returnPathNote.text }}
            </span>
          </dd>
        </template>

        <template v-if="messageId">
          <dt>Message-ID</dt>
          <dd class="eha-mono">{{ messageId.replace(/^<|>$/g, '') }}</dd>
        </template>
      </dl>

      <div
        v-if="returnPathNote && !returnPathNote.same"
        class="message-note"
        :class="senderNotConfirmed ? 'eha-failed' : 'eha-slow'"
      >
        <q-icon
          :name="senderNotConfirmed ? 'warning_amber' : 'info_outline'"
          size="18px"
          aria-hidden="true"
        />
        <span>
          <strong>Different domains.</strong>
          The visible sender is {{ returnPathNote.fromDomain }}, but messages about failed delivery
          go to {{ returnPathNote.returnPathDomain }}.
          <template v-if="!senderNotConfirmed">
            This is common for newsletters and other emails sent through a mail service.
          </template>
        </span>
      </div>
    </template>
  </section>
</template>

<style scoped>
.message-hint {
  margin-bottom: 16px;
}

.message-divider {
  height: 1px;
  margin: 20px 0;
  background: var(--eha-line-soft);
}

.message-same {
  margin-left: 6px;
  padding: 1px 8px;
  font-size: 12px;
}

.message-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
}

.message-note .q-icon {
  flex: none;
  margin-top: 2px;
}
</style>
