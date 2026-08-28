<script setup lang="ts">
import { ref, computed } from 'vue';

import type { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts';

import { mailHelper } from 'src/helpers/mailHelper';
import { analyzeMail, domainOf, sameOrg } from 'src/helpers/analysis';
import type { AlignHint } from 'src/helpers/analysis';

import LetterWithEnvelope from 'src/components/LetterWithEnvelope.vue';
import MailHeaderDetailBox from 'src/components/MailHeaderDetailBox.vue';
import MailTimeline from 'src/components/MailTimeline.vue';
import MailFlowTable from 'src/components/MailFlowTable.vue';
import VerdictBar from 'src/components/VerdictBar.vue';
import FindingsPanel from 'src/components/FindingsPanel.vue';
import SummaryCard from 'src/components/SummaryCard.vue';
import HeadersTable from 'src/components/HeadersTable.vue';

const MailHeaders = {
  From: 'From',
  To: 'To',
  Subject: 'Subject',
  Received: 'Received',
  ReplyTo: 'Reply-To',
  ReturnPath: 'Return-Path',
  MessageId: 'Message-Id',
  Date: 'Date',
  DkimSignature: 'DKIM-Signature',
  AuthenticationResults: 'Authentication-Results',
};

const mailHeader = ref<string>();

const mailHeaderParts = computed(() => {
  if (!mailHeader.value) {
    return undefined;
  }

  try {
    return mailHelper.splitMailHeader(mailHeader.value);
  } catch (error) {
    console.error(error);
    return undefined;
  }
});

const returnPathHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.ReturnPath);
});

const returnPath = computed(() => {
  if (!returnPathHeaders.value || returnPathHeaders.value.length === 0) {
    return undefined;
  }

  return returnPathHeaders.value[0]?.headerData;
});

const fromHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.From);
});

const from = computed(() => {
  if (!fromHeaders.value || fromHeaders.value.length === 0) {
    return undefined;
  }

  return fromHeaders.value[0]?.headerData;
});

const toHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.To);
});

const to = computed(() => {
  if (!toHeaders.value || toHeaders.value.length === 0) {
    return undefined;
  }

  return toHeaders.value[0]?.headerData;
});

const dateHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.Date);
});

const messageIdHeaders = computed(() => {
  return mailHeaderParts.value?.filter(
    (header) => header.headerName.toLowerCase() === MailHeaders.MessageId.toLowerCase(),
  );
});

const subjectHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.Subject);
});

const subject = computed(() => {
  if (!subjectHeaders.value || subjectHeaders.value.length === 0) {
    return undefined;
  }

  return subjectHeaders.value[0]?.headerData;
});

const receivedHeaders = computed<ReceivedHeaderParts[] | undefined>(() => {
  if (!mailHeaderParts.value) {
    return undefined;
  }
  const filteredHeaders = mailHeaderParts.value?.filter(
    (header) => header.headerName === MailHeaders.Received,
  );

  if (!filteredHeaders) {
    return undefined;
  }

  const items = filteredHeaders
    .filter((o) => o.headerData)
    .map((headerDetail) => mailHelper.parseReceivedHeader(headerDetail));

  items?.sort((a, b) => {
    if (a.rawHeaderDetails.headerIndex && b.rawHeaderDetails.headerIndex) {
      return b.rawHeaderDetails.headerIndex - a.rawHeaderDetails.headerIndex;
    }
    return -1;
  });
  return items;
});

const replyToHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.ReplyTo);
});

const authenticationResultsHeaders = computed(() => {
  return mailHeaderParts.value?.filter(
    (header) => header.headerName === MailHeaders.AuthenticationResults,
  );
});

const dkimSignatureHeaders = computed(() => {
  return mailHeaderParts.value?.filter((header) => header.headerName === MailHeaders.DkimSignature);
});

const otherHeaders = computed(() => {
  const ignoreHeaderNames = Object.values(MailHeaders);
  return mailHeaderParts.value?.filter(
    (header) => !ignoreHeaderNames.includes(header.headerName),
  );
});

function alignAgainstFrom(
  value: string | undefined,
  severity: AlignHint['severity'],
  text: string,
): AlignHint | undefined {
  const other = domainOf(value);
  const fromDomain = domainOf(from.value);
  if (!other || !fromDomain || sameOrg(other, fromDomain)) return undefined;
  return { severity, text };
}

const identityCards = computed(() => {
  if (!mailHeaderParts.value) return [];

  const cards: Array<{
    key: string;
    label: string;
    value: string | undefined;
    mono: boolean;
    align?: AlignHint | undefined;
  }> = [
    {
      key: 'return-path',
      label: 'Return-Path',
      value: returnPath.value,
      mono: true,
      align: alignAgainstFrom(returnPath.value, 'warn', 'differs from From'),
    },
    { key: 'from', label: 'From', value: from.value, mono: true },
    { key: 'to', label: 'To', value: to.value, mono: true },
    {
      key: 'reply-to',
      label: 'Reply-To',
      value: replyToHeaders.value?.[0]?.headerData,
      mono: true,
      align: alignAgainstFrom(
        replyToHeaders.value?.[0]?.headerData,
        'warn',
        'differs from From',
      ),
    },
    {
      key: 'message-id',
      label: 'Message-ID',
      value: messageIdHeaders.value?.[0]?.headerData,
      mono: true,
      align: alignAgainstFrom(
        messageIdHeaders.value?.[0]?.headerData,
        'info',
        'third-party domain',
      ),
    },
    { key: 'date', label: 'Date', value: dateHeaders.value?.[0]?.headerData, mono: true },
    { key: 'subject', label: 'Subject', value: subject.value, mono: false },
  ];

  return cards.filter((card) => card.value);
});

const analysis = computed(() => {
  if (!mailHeaderParts.value) {
    return undefined;
  }

  return analyzeMail({
    headers: mailHeaderParts.value,
    received: receivedHeaders.value,
  });
});
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-sm">
      <div class="col">
        <q-input
          v-model="mailHeader"
          spellcheck="false"
          placeholder="Paste email headers here"
          outlined
          type="textarea"
          :rows="mailHeader ? 6 : 30"
        />
      </div>
      <div v-show="mailHeader" style="width: 50px">
        <q-btn
          flat
          icon="close"
          aria-label="Clear headers"
          class="clear-btn full-width full-height"
          @click="mailHeader = undefined"
        />
      </div>
    </div>

    <VerdictBar v-if="analysis" :result="analysis" class="q-mt-md rise-in" />
    <FindingsPanel
      v-if="analysis"
      :result="analysis"
      class="q-mt-lg rise-in"
      style="--rise-delay: 60ms"
    />

    <div v-if="mailHeader" class="row q-mt-lg rise-in" style="--rise-delay: 120ms">
      <div class="col-12 col-md-5">
        <LetterWithEnvelope :to="to" :from="from" :subject="subject" :return-path="returnPath" />
      </div>
      <div id="mail-authentication" class="col-12 col-md-7">
        <div class="q-my-lg">
          <div class="summary-grid">
            <SummaryCard
              v-for="card in identityCards"
              :key="card.key"
              :label="card.label"
              :value="card.value"
              :mono="card.mono"
              :align="card.align"
            />
          </div>

          <div class="q-gutter-xs q-mt-md">
            <MailHeaderDetailBox
              v-if="authenticationResultsHeaders && authenticationResultsHeaders.length > 0"
              name="Authentication-Results"
              :details="authenticationResultsHeaders.map((o) => o.headerData)"
              :preformatted="true"
            />

            <MailHeaderDetailBox
              v-if="dkimSignatureHeaders && dkimSignatureHeaders.length > 0"
              name="Dkim Signature"
              :details="dkimSignatureHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-if="mailHeader" class="rise-in" style="--rise-delay: 180ms">
      <h2 id="mail-hops">Mail Hops</h2>
      <div v-if="receivedHeaders" class="q-mt-sm">
        <MailTimeline :received-headers="receivedHeaders" />
        <MailFlowTable :received-headers="receivedHeaders" class="q-mt-md" />
      </div>

      <h2>Other Headers</h2>
      <HeadersTable v-if="otherHeaders" :rows="otherHeaders" />
    </div>
  </q-page>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.7rem;
}

.clear-btn {
  background: var(--panel-2);
  color: var(--ink-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.clear-btn:hover {
  color: var(--fail);
  border-color: color-mix(in srgb, var(--fail) 45%, transparent);
}
</style>
