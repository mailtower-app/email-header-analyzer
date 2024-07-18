<script setup lang="ts">
import { ref, computed } from 'vue'

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

const fromHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.From)
})

const toHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.To)
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

const receivedHeaders = computed(() => {
  if (!mailHeaderParts.value) {
    return undefined
  }
  const filteredHeaders = mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.Received)

  console.log(filteredHeaders?.length)

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

function parseReceivedHeader (headerDetails: HeaderDetails): ReceivedHeaderParts {
  const fromTextPart = 'from'
  const byTextPart = 'by'
  const withTextPart = 'with'
  const idTextPart = 'id'
  const viaTextPart = 'via'

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

  const fromStartIndex = tempHeader.indexOf(`${fromTextPart} `)
  if (fromStartIndex === -1) {
    return result
  }

  const fromDataStartIndex = fromStartIndex + fromTextPart.length + 1

  // Section - by

  const byStartIndex = tempHeader.indexOf(`${byTextPart} `, fromDataStartIndex)
  if (byStartIndex === -1) {
    return result
  }

  result.fromDomain = tempHeader.slice(fromDataStartIndex, byStartIndex - 1)

  const byDataStartIndex = byStartIndex + byTextPart.length + 1

  // Section - with

  const withStartIndex = tempHeader.indexOf(`${withTextPart} `, byDataStartIndex)
  if (withStartIndex === -1) {
    return result
  }

  result.byDomain = tempHeader.slice(byDataStartIndex, withStartIndex - 1)

  const withDataStartIndex = withStartIndex + withTextPart.length + 1
  let withDataEndIndex = tempHeader.length

  // Prepare for optional

  let nextSearchStartIndex = withDataStartIndex

  // Section - id

  const idStartIndex = tempHeader.indexOf(`${idTextPart} `, nextSearchStartIndex)
  let idDataStartIndex = 0
  let idDataEndIndex = 0
  if (idStartIndex !== -1) {
    idDataStartIndex = idStartIndex + idTextPart.length + 1
    nextSearchStartIndex = idDataStartIndex

    withDataEndIndex = idStartIndex - 1
  }

  // Section - via

  const viaStartIndex = tempHeader.indexOf(`${viaTextPart} `, nextSearchStartIndex)
  let viaDataStartIndex = 0
  let viaDataEndIndex = 0
  if (viaStartIndex !== -1) {
    viaDataStartIndex = viaStartIndex + viaTextPart.length + 1

    nextSearchStartIndex = viaDataStartIndex

    idDataEndIndex = viaStartIndex - 1

    viaDataEndIndex = tempHeader.length
  } else {
    idDataEndIndex = tempHeader.length
  }

  // Extract data

  if (withDataStartIndex > 0) {
    result.with = tempHeader.slice(withDataStartIndex, withDataEndIndex)
  }
  if (idDataStartIndex > 0) {
    result.id = tempHeader.slice(idDataStartIndex, idDataEndIndex)
  }
  if (viaDataStartIndex > 0) {
    result.via = tempHeader.slice(viaDataStartIndex, viaDataEndIndex)
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

    <div class="q-my-md">
      <div class="row q-col-gutter-sm">
        <div
          v-if="returnPathHeaders && returnPathHeaders.length > 0"
          class="col-2 relative-position"
        >
          <q-badge
            floating
            color="white"
            text-color="black"
          >
            Return-Path
          </q-badge>
          <div class="q-pa-sm bg-blue text-white">
            {{ returnPathHeaders[0].headerData }}
          </div>
        </div>
        <div
          v-if="fromHeaders && fromHeaders.length > 0"
          class="col-2 relative-position"
        >
          <q-badge
            floating
            color="white"
            text-color="black"
          >
            From
          </q-badge>
          <div class="q-pa-sm bg-blue text-white">
            {{ fromHeaders[0].headerData }}
          </div>
        </div>
        <div
          v-if="toHeaders && toHeaders.length > 0"
          class="col-2 relative-position"
        >
          <q-badge
            floating
            color="white"
            text-color="black"
          >
            To
          </q-badge>
          <div class="q-pa-sm bg-blue text-white">
            {{ toHeaders[0].headerData }}
          </div>
        </div>
        <div
          v-if="messageIdHeaders && messageIdHeaders.length > 0"
          class="col-2 relative-position"
        >
          <q-badge
            floating
            color="white"
            text-color="black"
          >
            Message-Id
          </q-badge>
          <div class="q-pa-sm bg-blue text-white">
            {{ messageIdHeaders[0].headerData }}
          </div>
        </div>
        <div
          v-if="dateHeaders && dateHeaders.length > 0"
          class="col-2 relative-position"
        >
          <q-badge
            floating
            color="white"
            text-color="black"
          >
            Date
          </q-badge>
          <div class="q-pa-sm bg-blue text-white">
            {{ dateHeaders[0].headerData }}
          </div>
        </div>
        <div
          v-if="subjectHeaders && subjectHeaders.length > 0"
          class="col-2 relative-position"
        >
          <q-badge
            floating
            color="white"
            text-color="black"
          >
            Subject
          </q-badge>
          <div class="q-pa-sm bg-blue text-white">
            {{ subjectHeaders[0].headerData }}
          </div>
        </div>
        <div
          v-if="mailHeaderParts"
          class="col-2 relative-position"
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

        <div
          v-if="receivedHeaders"
          class="q-mt-sm"
        >
          <div>
            <div
              v-for="(received, index) in receivedHeaders"
              :key="index"
              class="q-pa-sm col-2 bg-grey text-white q-mb-sm"
            >
              <pre style="margin: 0px;">{{ received }}</pre>
            </div>
          </div>
        </div>
      </div>

      <q-table
        v-if="otherHeaders"
        flat
        bordered
        wrap-cells
        :rows-per-page-options="[0]"
        :rows="otherHeaders"
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
