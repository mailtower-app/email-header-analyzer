<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QTableProps } from 'quasar';

import type { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts';

import { mailHelper } from 'src/helpers/mailHelper';

import LetterWithEnvelope from 'src/components/LetterWithEnvelope.vue';
import MailHeaderDetailBox from 'src/components/MailHeaderDetailBox.vue';
import MailFlow from 'src/components/MailFlow.vue';
import MailFlowTable from 'src/components/MailFlowTable.vue';

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
const filter = ref<string | undefined>();

const columns: QTableProps['columns'] = [
  {
    name: 'headerName',
    align: 'left',
    label: 'Name',
    field: 'headerName',
    sortable: false,
    style: 'width: 300px',
  },
  {
    name: 'headerData',
    align: 'left',
    label: 'Data',
    field: 'headerData',
    sortable: false,
    classes: 'text-break',
  },
  {
    name: 'headerIndex',
    align: 'left',
    label: 'Index',
    field: 'headerIndex',
    sortable: false,
    style: 'width: 70px',
  },
];

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
  const filteredHeaders = mailHeaderParts.value?.filter(
    (header) => !ignoreHeaderNames.includes(header.headerName),
  );

  const filterTerm = filter.value?.toLowerCase();
  if (filterTerm) {
    return mailHeaderParts.value?.filter(
      (header) =>
        header.headerName.toLowerCase().includes(filterTerm) ||
        header.headerData.toLowerCase().includes(filterTerm),
    );
  }
  return filteredHeaders;
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
          class="cursor-pointer full-width full-height bg-red text-white"
          @click="mailHeader = undefined"
        />
      </div>
    </div>

    <div v-if="mailHeader" class="row">
      <div class="col-12 col-md-5">
        <LetterWithEnvelope :to="to" :from="from" :subject="subject" :return-path="returnPath" />
      </div>
      <div class="col-12 col-md-7">
        <div class="q-my-lg">
          <div class="q-gutter-xs">
            <MailHeaderDetailBox
              v-if="returnPathHeaders && returnPathHeaders.length > 0"
              name="Return-Path"
              :details="returnPathHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />
            <MailHeaderDetailBox
              v-if="fromHeaders && fromHeaders.length > 0"
              name="From"
              :details="fromHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />

            <MailHeaderDetailBox
              v-if="toHeaders && toHeaders.length > 0"
              name="To"
              :details="toHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />

            <MailHeaderDetailBox
              v-if="replyToHeaders && replyToHeaders.length > 0"
              name="Reply-To"
              :details="replyToHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />

            <MailHeaderDetailBox
              v-if="messageIdHeaders && messageIdHeaders.length > 0"
              name="Message-Id"
              :details="messageIdHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />

            <MailHeaderDetailBox
              v-if="dateHeaders && dateHeaders.length > 0"
              name="Date"
              :details="dateHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />

            <MailHeaderDetailBox
              v-if="subjectHeaders && subjectHeaders.length > 0"
              name="Subject"
              :details="subjectHeaders?.map((o) => o.headerData)"
              :preformatted="false"
            />

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
    <div v-if="mailHeader">
      <h2>Mail Hops</h2>
      <div v-if="receivedHeaders" class="q-mt-sm">
        <MailFlow :received-headers="receivedHeaders" />
        <MailFlowTable :received-headers="receivedHeaders" />
      </div>

      <h2>Other Headers</h2>
      <q-table
        v-if="otherHeaders"
        flat
        bordered
        wrap-cells
        :rows-per-page-options="[0]"
        :rows="otherHeaders"
        :columns="columns"
        class="full-width"
        table-style="min-height: 400px;"
      >
        <template #top>
          <q-input
            v-model="filter"
            outlined
            dense
            debounce="100"
            placeholder="Search"
            class="full-width"
            :bg-color="filter ? 'grey-3' : ''"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<style scoped>
:deep(.text-break) {
  word-break: break-all;
}
</style>
