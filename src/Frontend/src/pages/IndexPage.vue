<script setup lang="ts">
import { ref, computed } from 'vue'

interface HeaderDetails {
  headerName: string
  headerData: string
}

type ReceivedHeaderParts = {
  fromDomain: string
  fromIpAddress?: string
  byDomain: string
  byIpAddress?: string
  via?: string
  with?: string
  id?: string
  for?: string
  dateTime: string
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

const mailHeaderParts = computed(() => {
  const lines = mailHeader.value?.split(/\r?\n/)
  if (!lines) {
    return undefined
  }

  const formattedHeader = []
  let currentLine = ''

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
        formattedHeader.push(decodeHeaderField(currentLine))
      }
      currentLine = line
    }
  }

  // Push the last accumulated line
  if (currentLine) {
    formattedHeader.push(decodeHeaderField(currentLine))
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
  return mailHeaderParts.value?.filter(header => header.headerName === MailHeaders.Received)
})

const otherHeaders = computed(() => {
  const test = Object.values(MailHeaders)
  return mailHeaderParts.value?.filter(header => !test.includes(header.headerName))
})

function parseReceivedHeader (header: string): ReceivedHeaderParts | string {
  const fromTextPart = 'from'
  const byTextPart = 'by'
  const withTextPart = 'with'

  const result : ReceivedHeaderParts = {
    fromDomain: '',
    byDomain: '',
    dateTime: ''
  }

  let tempHeader = header

  const indexOfSemilicon = header.lastIndexOf(';')
  if (indexOfSemilicon !== -1) {
    result.dateTime = header.slice(indexOfSemilicon + 1).trim()
    tempHeader = header.slice(0, indexOfSemilicon)
  }

  const fromStartIndex = tempHeader.indexOf(`${fromTextPart} `)
  if (fromStartIndex === -1) {
    return ''
  }

  const fromDataStartIndex = fromStartIndex + fromTextPart.length + 1

  const byStartIndex = tempHeader.indexOf(`${byTextPart} `, fromDataStartIndex)
  if (byStartIndex === -1) {
    return ''
  }

  result.fromDomain = tempHeader.slice(fromDataStartIndex, byStartIndex - 1)

  const byDataStartIndex = byStartIndex + byTextPart.length + 1

  const withStartIndex = tempHeader.indexOf(`${withTextPart} `, byDataStartIndex)
  if (withStartIndex === -1) {
    return ''
  }

  result.byDomain = tempHeader.slice(byDataStartIndex, withStartIndex - 1)

  const withDataStartIndex = withStartIndex + withTextPart.length + 1

  result.with = tempHeader.slice(withDataStartIndex, tempHeader.length)

  // Todo: Id, via split

  return result
}

function decodeHeaderField (field: string): HeaderDetails {
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
    headerData: rawHeaderField.slice(indexOfFirstColon + 1)
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
          v-if="returnPathHeaders"
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
          v-if="fromHeaders"
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
          v-if="toHeaders"
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
          v-if="messageIdHeaders"
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
          v-if="dateHeaders"
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
          v-if="subjectHeaders"
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
              v-for="received in receivedHeaders"
              :key="received.headerData"
              class="q-pa-sm col-2 bg-grey text-white q-mb-sm"
            >
              <pre>{{ parseReceivedHeader(received.headerData) ?? 'null' }}</pre>
              <hr>
              {{ received.headerData }}
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
      />
    </div>
  </q-page>
</template>
