<script setup lang="ts">
import { ref, computed } from 'vue'
import { QTableProps } from 'quasar'

import { mailHelper } from 'src/helpers/mailHelper'
import { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts'

const MailHeaders = {
  From: 'From',
  To: 'To',
  Subject: 'Subject',
  Received: 'Received',
  ReturnPath: 'Return-Path',
  MessageId: 'Message-Id',
  Date: 'Date'
}

const mailHeader = ref<string>()
const filter = ref<string | undefined>()

const columns : QTableProps['columns'] = [
  {
    name: 'headerName',
    align: 'left',
    label: 'Name',
    field: 'headerName',
    sortable: false,
    style: 'width: 300px'
  },
  {
    name: 'headerData',
    align: 'left',
    label: 'Data',
    field: 'headerData',
    sortable: false,
    classes: 'text-break'
  },
  {
    name: 'headerIndex',
    align: 'left',
    label: 'Index',
    field: 'headerIndex',
    sortable: false,
    style: 'width: 70px'
  }
]

const mailHeaderParts = computed(() => {
  if (!mailHeader.value) {
    return undefined
  }

  return mailHelper.splitMailHeader(mailHeader.value)
})

const returnPathHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.ReturnPath)
})

const returnPath = computed(() => {
  if (!returnPathHeaders.value) {
    return undefined
  }

  return returnPathHeaders.value[0].headerData
})

const fromHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.From)
})

const from = computed(() => {
  if (!fromHeaders.value) {
    return undefined
  }

  return fromHeaders.value[0].headerData
})

const toHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.To)
})

const to = computed(() => {
  if (!toHeaders.value) {
    return undefined
  }

  return toHeaders.value[0].headerData
})

const dateHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.Date)
})

const messageIdHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.MessageId)
})

const subjectHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.Subject)
})

const subject = computed(() => {
  if (!subjectHeaders.value) {
    return undefined
  }

  return subjectHeaders.value[0].headerData
})

const receivedHeaders = computed<ReceivedHeaderParts[] | undefined>(() => {
  if (!mailHeaderParts.value) {
    return undefined
  }
  const filteredHeaders = mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.Received)

  if (!filteredHeaders) {
    return undefined
  }

  const receivedHeaders = filteredHeaders.filter(o => o.headerData).map(headerDetail => mailHelper.parseReceivedHeader(headerDetail))

  receivedHeaders?.sort((a, b) => {
    if (a.rawHeaderDetails.headerIndex && b.rawHeaderDetails.headerIndex) {
      return b.rawHeaderDetails.headerIndex - a.rawHeaderDetails.headerIndex
    }
    return -1
  })
  return receivedHeaders
})

const authenticationResultsHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === 'Authentication-Results')
})

const otherHeaders = computed(() => {
  const ignoreHeaderNames = Object.values(MailHeaders)
  const filteredHeaders = mailHeaderParts.value?.filter(header => !ignoreHeaderNames.includes(header.headerName))

  const filterTerm = filter.value?.toLowerCase()
  if (filterTerm) {
    return filteredHeaders?.filter(header => header.headerName.toLowerCase().includes(filterTerm))
  }
  return filteredHeaders
})

function svgReceiveTranslate (index: number) : string {
  const maxItemsPerRow = 6
  const boxWidth = 115
  const boxHeight = 45

  const factor = Math.floor(index / maxItemsPerRow)

  const y = factor * boxHeight
  const x = (index % maxItemsPerRow) * boxWidth

  return `translate(${x}, ${y})`
}

</script>

<template>
  <q-page padding>
    <div>
      <q-input
        v-model="mailHeader"
        spellcheck="false"
        placeholder="Paste email headers here"
        outlined
        type="textarea"
      />
    </div>

    <div
      v-if="mailHeader"
      class="row"
    >
      <div class="col-12 col-md-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xml:space="preserve"
          width="100%"
          height="600"
          version="1.1"
          viewBox="0 0 32 32"
        >
          <g id="mail"><path
            d="m2.43 29.04 13.55-9.88 13.55 9.88"
            style="fill:none;stroke:#263238;stroke-width:.8;stroke-dasharray:none;"
          /><path
            d="m2.43 13.55 3.25-2.35"
            style="fill:none;stroke:#263238;stroke-width:.8;stroke-dasharray:none;"
          /><path
            d="m26.48 11.2 3.05 2.46"
            style="fill:none;stroke:#263238;stroke-width:.8;stroke-dasharray:none;"
          /><path
            d="M5.48 15.94c.12-.3 0-14.43 0-14.43H20.5l6.15 6.15v8.13"
            style="fill:none;stroke:#666666;stroke-width:.8;"
          /><path
            d="M7 12 20 12 Z"
            style="fill:none;stroke:#CCCCCC;stroke-width:.3;"
          /><path
            d="M7 14 24 14 Z"
            style="fill:none;stroke:#CCCCCC;stroke-width:.3;"
          /><path
            d="M7 16 24 16 Z"
            style="fill:none;stroke:#CCCCCC;stroke-width:.3;"
          /><path
            d="m11.6 20.16-9.17-6.61v16.87h27.1V13.66l-9.09 6.5"
            style="fill:none;stroke:#263238;stroke-width:.8;stroke-linejoin:round;"
          /></g>

          <g
            id="letter"
            transform="translate(0,-2)"
          >
            <text
              x="7"
              y="5.9"
              style="font:normal 0.5px sans-serif; fill: #666;;"
            >From</text>
            <text
              x="7"
              y="6.8"
              style="font:normal 0.7px sans-serif;"
            >{{ from }}</text>

            <text
              x="7"
              y="7.6"
              style="font:normal 0.5px sans-serif; fill: #666;;"
            >To</text>
            <text
              x="7"
              y="8.5"
              style="font:normal 0.7px sans-serif;"
            >{{ to }}</text>

            <text
              x="7"
              y="12"
              style="font:normal 0.7px sans-serif; font-weight: bold;"
            >{{ subject }}</text>
          </g>

          <g>
            <text
              x="11"
              y="26"
              style="font:normal 0.5px sans-serif; fill: #666;;"
            >ReturnPath</text>
            <text
              x="11"
              y="27"
              style="font:italic 1.0px sans-serif;"
            >{{ returnPath }}</text>
          </g>
        </svg>
      </div>
      <div class="col-12 col-md-4">
        <div class="q-my-md">
          <div class="q-gutter-sm">
            <div
              v-if="returnPathHeaders && returnPathHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                Return-Path
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(returnPathHeader, index) in returnPathHeaders"
                  :key="`returnPathHeader-${index}`"
                >
                  {{ returnPathHeader.headerData }}
                </div>
              </div>
            </div>
            <div
              v-if="fromHeaders && fromHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                From
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(fromHeader, index) in fromHeaders"
                  :key="`fromHeader-${index}`"
                >
                  {{ fromHeader.headerData }}
                </div>
              </div>
            </div>
            <div
              v-if="toHeaders && toHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                To
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(toHeader, index) in toHeaders"
                  :key="`toHeader-${index}`"
                >
                  {{ toHeader.headerData }}
                </div>
              </div>
            </div>
            <div
              v-if="messageIdHeaders && messageIdHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                Message-Id
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(messageIdHeader, index) in messageIdHeaders"
                  :key="`messageIdHeader-${index}`"
                >
                  {{ messageIdHeader.headerData }}
                </div>
              </div>
            </div>
            <div
              v-if="dateHeaders && dateHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                Date
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(dateHeader, index) in dateHeaders"
                  :key="`dateHeader-${index}`"
                >
                  {{ dateHeader.headerData }}
                </div>
              </div>
            </div>
            <div
              v-if="subjectHeaders && subjectHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                Subject
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(subjectHeader, index) in subjectHeaders"
                  :key="`subjectHeader-${index}`"
                >
                  {{ subjectHeader.headerData }}
                </div>
              </div>
            </div>
            <div
              v-if="authenticationResultsHeaders && authenticationResultsHeaders.length > 0"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                Authentication-Results
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                <div
                  v-for="(authenticationResultsHeader, index) in authenticationResultsHeaders"
                  :key="`subjectHeader-${index}`"
                >
                  {{ authenticationResultsHeader.headerData }}
                </div>
              </div>
            </div>

            <div
              v-if="mailHeaderParts"
              class="relative-position"
            >
              <q-badge
                floating
                color="white"
                text-color="black"
              >
                Total Headers
              </q-badge>
              <div class="q-pa-sm bg-grey text-white">
                {{ mailHeaderParts?.length }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      <h2>Mail Hops</h2>
      <div
        v-if="receivedHeaders"
        class="q-mt-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xml:space="preserve"
          width="100%"
          height="270"
          version="1.1"
          viewBox="0 0 700 100"
        >
          <g
            v-for="(received, index) in receivedHeaders"
            :key="index"
            :transform="svgReceiveTranslate(index)"
          >
            <path
              d="M 0 0 H 10 V 10 H 0 Z"
              style="fill:gray;"
            />
            <text
              x="5"
              y="5.5"
              dominant-baseline="middle"
              text-anchor="middle"
              style="font:normal 4px sans-serif; fill: #fff;"
            >{{ index + 1 }}</text>
            <path
              d="M 0 0 H 110 V 40 H 0 Z"
              style="fill:none;stroke:#263238;stroke-width:.6;"
            />
            <path
              v-if="index < receivedHeaders.length - 1"
              d="M 111,15 L 114,20 L 111,25 Z"
              style="fill:#aaa;stroke:#888;stroke-width:.3;"
            />
            <text
              x="4"
              y="20"
              style="font:bold 4px sans-serif; fill: #666;"
            >{{ received.byDomain }}</text>
            <text
              x="4"
              y="26"
              style="font:normal 4px sans-serif; fill: #666;"
            >{{ received.byIpAddress }}</text>

            <text
              x="4"
              y="32"
              style="font:normal 4px sans-serif; fill: #666;"
            >{{ received.with?.slice(0,50) }}</text>
          </g>
        </svg>

        <!-- <div>
          <div
            v-for="(received, index) in receivedHeaders"
            :key="index"
            class="q-pa-sm col-2 bg-grey text-white q-mb-sm"
          >
            <pre style="margin: 0px; white-space: pre-wrap;">{{ received }}</pre>
          </div>
        </div> -->
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
