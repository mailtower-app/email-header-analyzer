<script setup lang="ts">
import { ref, computed } from 'vue'
import { QTableProps } from 'quasar'

interface HeaderDetails {
  headerName: string
  headerData: string
  headerIndex: number
}

type ReceivedHeaderParts = {
  rawHeaderDetails: HeaderDetails
  fromDomain?: string
  fromIpAddress?: string
  byDomain?: string
  byIpAddress?: string
  via?: string
  with?: string
  id?: string
  for?: string
  dateTime?: Date
}

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
  const lines = mailHeader.value?.split(/\r?\n/)
  if (!lines) {
    return undefined
  }

  const formattedHeader = []
  let currentLine = ''
  let headerIndex = 0

  for (const line of lines) {
    if (!line) {
      break
    }

    if (/^\s/.test(line)) {
      // Line is a continuation of the previous header field
      currentLine += ' ' + line.trim()
    } else {
      // Line is a new header field
      if (currentLine) {
        formattedHeader.push(decodeHeaderField(currentLine, headerIndex))
        headerIndex++
      }
      currentLine = line
    }
  }

  // Push the last accumulated line
  if (currentLine) {
    formattedHeader.push(decodeHeaderField(currentLine, headerIndex))
  }

  // Join the formatted header lines with new lines
  return formattedHeader
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

const receivedHeaders = computed(() => {
  if (!mailHeaderParts.value) {
    return undefined
  }
  const filteredHeaders = mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.Received)

  if (!filteredHeaders) {
    return undefined
  }

  const receivedHeaders = filteredHeaders.filter(o => o.headerData).map(headerDetail => parseReceivedHeader(headerDetail))

  receivedHeaders?.sort((a, b) => {
    if (a.rawHeaderDetails.headerIndex && b.rawHeaderDetails.headerIndex) {
      return b.rawHeaderDetails.headerIndex - a.rawHeaderDetails.headerIndex
    }
    return -1
  })
  return receivedHeaders
})

const otherHeaders = computed(() => {
  const ignoreHeaderNames = Object.values(MailHeaders)
  const filteredHeaders = mailHeaderParts.value?.filter(header => !ignoreHeaderNames.includes(header.headerName))
  if (filter.value) {
    return filteredHeaders?.filter(header => header.headerName.toLowerCase().includes(filter.value?.toLowerCase()))
  }
  return filteredHeaders
})

function splitMailHeaderDomainIpAddress (receiveHeader : string) : string[] {
  const indexOfOpeningRoundClamp = receiveHeader.indexOf('(')
  if (indexOfOpeningRoundClamp === -1) {
    return [receiveHeader]
  }

  const hostname = receiveHeader.slice(0, indexOfOpeningRoundClamp).trim()
  const ipAddress = receiveHeader.slice(indexOfOpeningRoundClamp + 1, receiveHeader.indexOf(')')).trim()

  return [hostname, ipAddress]
}

function parseReceivedHeader (headerDetails: HeaderDetails): ReceivedHeaderParts {
  const textPartFrom = 'from'
  const textPartBy = 'by'
  const textPartWith = 'with'
  const textPartId = 'id'
  const textPartVia = 'via'

  const result : ReceivedHeaderParts = {
    rawHeaderDetails: headerDetails
  }

  if (!headerDetails.headerData) {
    return result
  }

  let tempHeader = headerDetails.headerData

  // Extract Date at the end

  const indexOfSemilicon = headerDetails.headerData.lastIndexOf(';')
  if (indexOfSemilicon !== -1) {
    const tempDate = headerDetails.headerData.slice(indexOfSemilicon + 1).trim()
    result.dateTime = new Date(tempDate)
    tempHeader = headerDetails.headerData.slice(0, indexOfSemilicon)
  }

  // Section - from

  const startIndexFrom = tempHeader.indexOf(`${textPartFrom} `)
  if (startIndexFrom === -1) {
    return result
  }

  const dataStartIndexFrom = startIndexFrom + textPartFrom.length + 1

  // Section - by

  const startIndexBy = tempHeader.indexOf(`${textPartBy} `, dataStartIndexFrom)
  if (startIndexBy === -1) {
    return result
  }

  const tempFrom = tempHeader.slice(dataStartIndexFrom, startIndexBy - 1)
  const fromParts = splitMailHeaderDomainIpAddress(tempFrom)

  result.fromDomain = fromParts[0]
  result.fromIpAddress = fromParts[1]

  const dataStartIndexBy = startIndexBy + textPartBy.length + 1

  // Section - with

  const startIndexWith = tempHeader.indexOf(`${textPartWith} `, dataStartIndexBy)
  if (startIndexWith === -1) {
    return result
  }

  const tempBy = tempHeader.slice(dataStartIndexBy, startIndexWith - 1)
  const byParts = splitMailHeaderDomainIpAddress(tempBy)

  result.byDomain = byParts[0]
  result.byIpAddress = byParts[1]

  const dataStartIndexWith = startIndexWith + textPartWith.length + 1
  let dataEndIndexWith = tempHeader.length

  // Prepare for optional

  let startIndexNextSearch = dataStartIndexWith

  // Section - id

  const startIndexId = tempHeader.indexOf(`${textPartId} `, startIndexNextSearch)
  let dataStartIndexId = 0
  let dataEndIndexId = 0
  if (startIndexId !== -1) {
    dataStartIndexId = startIndexId + textPartId.length + 1
    startIndexNextSearch = dataStartIndexId

    dataEndIndexWith = startIndexId - 1
  }

  // Section - via

  const startIndexVia = tempHeader.indexOf(`${textPartVia} `, startIndexNextSearch)
  let dataStartIndexVia = 0
  let dataEndIndexVia = 0
  if (startIndexVia !== -1) {
    dataStartIndexVia = startIndexVia + textPartVia.length + 1

    startIndexNextSearch = dataStartIndexVia

    dataEndIndexId = startIndexVia - 1

    dataEndIndexVia = tempHeader.length
  } else {
    dataEndIndexId = tempHeader.length
  }

  // Extract data

  if (dataStartIndexWith > 0) {
    result.with = tempHeader.slice(dataStartIndexWith, dataEndIndexWith)
  }
  if (dataStartIndexId > 0) {
    result.id = tempHeader.slice(dataStartIndexId, dataEndIndexId)
  }
  if (dataStartIndexVia > 0) {
    result.via = tempHeader.slice(dataStartIndexVia, dataEndIndexVia)
  }

  return result
}

function decodeHeaderField (field: string, headerIndex: number): HeaderDetails {
  const rawHeaderField = field.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/gi, (_, charset, encoding, encodedText) => {
    if (encoding.toUpperCase() === 'B') {
      return decodeBase64(encodedText, charset)
    } else if (encoding.toUpperCase() === 'Q') {
      return decodeQuotedPrintable(encodedText, charset)
    }
    return field
  })

  const indexOfFirstColon = rawHeaderField.indexOf(':')

  return {
    headerName: rawHeaderField.slice(0, indexOfFirstColon),
    headerData: rawHeaderField.slice(indexOfFirstColon + 2),
    headerIndex
  }
}

function decodeBase64 (encodedText: string, charset: string): string {
  const decodedText = atob(encodedText)
  return new TextDecoder(charset).decode(new Uint8Array([...decodedText].map(char => char.charCodeAt(0))))
}

function decodeQuotedPrintable (encodedText: string, charset: string): string {
  const decodedText = encodedText.replace(/_/g, ' ').replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
  return new TextDecoder(charset).decode(new Uint8Array([...decodedText].map(char => char.charCodeAt(0))))
}

function svgReceiveTranslate (index: number) : string {
  const maxItemsPerRow = 6
  const boxWidth = 115
  const boxHeight = 45

  const factor = Math.floor(index / maxItemsPerRow)
  const y = factor * boxHeight

  const xReset = factor * maxItemsPerRow * boxWidth
  const x = (index * boxWidth) - xReset

  return `translate(${x}, ${y})`
}

</script>

<template>
  <q-page padding>
    <div>
      <q-input
        v-model="mailHeader"
        spellcheck="false"
        outlined
        type="textarea"
      />
    </div>

    <div class="row">
      <div class="col-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xml:space="preserve"
          width="100%"
          height="800"
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
            d="m11.6 20.16-9.17-6.61v16.87h27.1V13.66l-9.09 6.5"
            style="fill:none;stroke:#263238;stroke-width:.8;stroke-linejoin:round;"
          /></g>

          <g
            id="letter"
            transform="translate(0,-1.5)"
          >
            <text
              x="7"
              y="5.9"
              style="font:normal 0.5px sans-serif; fill: #666;;"
            >From</text>
            <text
              x="7"
              y="6.8"
              style="font:italic 0.8px sans-serif;"
            >{{ from }}</text>

            <text
              x="7"
              y="7.6"
              style="font:normal 0.5px sans-serif; fill: #666;;"
            >To</text>
            <text
              x="7"
              y="8.5"
              style="font:italic 0.8px sans-serif;"
            >{{ to }}</text>

            <text
              x="7"
              y="10.5"
              style="font:normal 0.8px sans-serif; font-weight: bold;"
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
      <div class="col-4">
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
              <div class="q-pa-sm bg-blue text-white">
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
              <div class="q-pa-sm bg-blue text-white">
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
              <div class="q-pa-sm bg-blue text-white">
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
              <div class="q-pa-sm bg-blue text-white">
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
              <div class="q-pa-sm bg-blue text-white">
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
              <div class="q-pa-sm bg-blue text-white">
                <div
                  v-for="(subjectHeader, index) in subjectHeaders"
                  :key="`subjectHeader-${index}`"
                >
                  {{ subjectHeader.headerData }}
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
              <div class="q-pa-sm bg-blue text-white">
                {{ mailHeaderParts?.length }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="receivedHeaders"
        class="q-mt-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xml:space="preserve"
          width="100%"
          height="300"
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
              x="4"
              y="6"
              style="font:normal 4px sans-serif; fill: #fff;"
            >{{ index + 1 }}</text>
            <path
              d="M 0 0 H 110 V 40 H 0 Z"
              style="fill:none;stroke:#263238;stroke-width:.8;"
            />
            <text
              x="4"
              y="20"
              style="font:normal 4px sans-serif; fill: #666;"
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

      <q-table
        v-if="otherHeaders"
        flat
        bordered
        wrap-cells
        :rows-per-page-options="[0]"
        :rows="otherHeaders"
        :columns="columns"
        title-class="header-table"
        class
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
