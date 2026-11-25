<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { ReceivedHeaderParts } from '@/models/ReceivedHeaderParts';

import { authenticationHelper } from '@/helpers/authenticationHelper';
import { mailHelper } from '@/helpers/mailHelper';

import AnalyzerStart from '@/components/AnalyzerStart.vue';
import AuthenticationDetails from '@/components/AuthenticationDetails.vue';
import HeaderTable from '@/components/HeaderTable.vue';
import MailFlow from '@/components/MailFlow.vue';
import MailMessageCard from '@/components/MailMessageCard.vue';
import MailVerdict from '@/components/MailVerdict.vue';

const MailHeaders = {
  ReturnPath: 'Return-Path',
  From: 'From',
  To: 'To',
  ReplyTo: 'Reply-To',
  MessageId: 'Message-Id',
  Date: 'Date',
  Subject: 'Subject',
  AuthenticationResults: 'Authentication-Results',
  Received: 'Received',
};

const mailHeader = ref<string>();
const isEditing = ref(false);

const mailHeaderParts = computed(() => {
  if (!mailHeader.value) {
    return [];
  }

  try {
    return mailHelper.splitMailHeader(mailHeader.value);
  } catch (error) {
    console.error(error);
    return [];
  }
});

const hasResult = computed(() => mailHeaderParts.value.length > 0);
const isInvalid = computed(() => !!mailHeader.value?.trim() && !hasResult.value);

// The first line of the header, shown in the collapsed input
const preview = computed(() => mailHeader.value?.trim().replace(/\s+/g, ' ').slice(0, 300));

function headerValues(headerName: string): string[] {
  return mailHelper.filterHeaders(mailHeaderParts.value, headerName).map((o) => o.headerData);
}

const from = computed(() => headerValues(MailHeaders.From)[0]);
const fromDomain = computed(() => mailHelper.parseMailAddresses(from.value)[0]?.domain);

// The first header is the newest, it was added by the receiving mail server
const authenticationResults = computed(() => headerValues(MailHeaders.AuthenticationResults));
const authenticationSummary = computed(() =>
  authenticationHelper.parseAuthenticationSummary(authenticationResults.value[0]),
);
const verdict = computed(() =>
  authenticationHelper.getVerdict(authenticationSummary.value, fromDomain.value),
);

// The newest hop is the first header, show the hops in the order of the delivery
const receivedHeaders = computed<ReceivedHeaderParts[]>(() => {
  return mailHelper
    .filterHeaders(mailHeaderParts.value, MailHeaders.Received)
    .filter((o) => o.headerData)
    .map((headerDetail) => mailHelper.parseReceivedHeader(headerDetail))
    .reverse();
});

function clear(): void {
  mailHeader.value = undefined;
  isEditing.value = false;
}

watch(hasResult, (value) => {
  if (!value) {
    isEditing.value = false;
  }
});
</script>

<template>
  <q-page class="eha-page">
    <div class="eha-container">
      <AnalyzerStart v-if="!hasResult" v-model="mailHeader" :invalid="isInvalid" />

      <div v-else class="eha-stack">
        <section class="eha-card input-bar" aria-label="Email header">
          <div class="input-bar-summary">
            <div class="input-bar-title">Email header · {{ mailHeaderParts.length }} fields</div>
            <div v-if="!isEditing" class="eha-mono eha-muted input-bar-preview">{{ preview }}</div>
          </div>
          <div class="input-bar-actions">
            <button
              type="button"
              class="eha-button"
              :aria-expanded="isEditing"
              @click="isEditing = !isEditing"
            >
              {{ isEditing ? 'Done' : 'Edit' }}
            </button>
            <button type="button" class="eha-button eha-button-quiet" @click="clear">Clear</button>
          </div>
          <div v-if="isEditing" class="input-bar-editor">
            <label for="header-edit" class="eha-sr-only">Email header</label>
            <textarea
              id="header-edit"
              v-model="mailHeader"
              rows="8"
              spellcheck="false"
              class="eha-input input-bar-textarea"
            ></textarea>
          </div>
        </section>

        <MailVerdict
          :summary="authenticationSummary"
          :from-domain="fromDomain"
          :received-headers="receivedHeaders"
        />

        <div class="analyzer-columns">
          <MailMessageCard
            class="analyzer-message"
            :subject="headerValues(MailHeaders.Subject)[0]"
            :from="from"
            :to="headerValues(MailHeaders.To)[0]"
            :reply-to="headerValues(MailHeaders.ReplyTo)[0]"
            :date="headerValues(MailHeaders.Date)[0]"
            :return-path="headerValues(MailHeaders.ReturnPath)[0]"
            :message-id="headerValues(MailHeaders.MessageId)[0]"
            :sender-not-confirmed="verdict.level === 'failed'"
          />
          <MailFlow
            class="analyzer-route"
            :received-headers="receivedHeaders"
            :spf="authenticationSummary.spf"
          />
        </div>

        <AuthenticationDetails
          v-if="authenticationResults.length > 0"
          :summary="authenticationSummary"
          :header-count="authenticationResults.length"
        />

        <HeaderTable :headers="mailHeaderParts" />
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.input-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 12px 12px 12px 20px;
  border-radius: 12px;
}

.input-bar-summary {
  flex: 999 1 240px;
  min-width: 0;
}

.input-bar-title {
  color: var(--eha-muted);
  font-size: 13px;
  font-weight: 600;
}

.input-bar-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-bar-actions {
  display: flex;
  gap: 8px;
}

.input-bar-editor {
  flex: 1 1 100%;
}

.input-bar-textarea {
  display: block;
  padding: 12px;
  font-family: var(--eha-mono);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}

.analyzer-columns {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 24px;
}

.analyzer-message {
  flex: 1 1 380px;
}

.analyzer-route {
  flex: 1.3 1 480px;
}

@media (max-width: 599px) {
  .input-bar {
    padding: 6px 6px 6px 14px;
  }

  .input-bar-preview {
    display: none;
  }

  .analyzer-columns {
    gap: 16px;
  }
}
</style>
