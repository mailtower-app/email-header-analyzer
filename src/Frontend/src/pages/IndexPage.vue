<script setup lang="ts">
import { ref, computed } from 'vue'

interface HeaderDetails {
  headerName: string
  headerData: string
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
      currentLine += line.trim()
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

const from = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === 'From')
})

const to = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === 'To')
})

const subject = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === 'Subject')
})

const receivedHeaders = computed(() => {
  return mailHeaderParts.value?.filter(header => header.headerName === 'Received')
})

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
        outlined
        type="textarea"
      />
    </div>

    <div class="q-my-md">
      <div class="row q-col-gutter-sm">
        <div v-if="from">
          <div class="q-pa-sm col-2 bg-blue text-white">
            {{ from[0].headerData }}
          </div>
        </div>
        <div v-if="to">
          <div class="q-pa-sm col-2 bg-blue text-white">
            {{ to[0].headerData }}
          </div>
        </div>
        <div v-if="subject">
          <div class="q-pa-sm col-2 bg-blue text-white">
            {{ subject[0].headerData }}
          </div>
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
            {{ received.headerData }}
          </div>
        </div>
      </div>
    </div>

    <q-list separator>
      <q-item
        v-for="(header, index) in mailHeaderParts"
        :key="index"
        dense
        class="q-pa-none"
      >
        <q-item-section
          no-wrap
          style="word-break: break-all; white-space: normal;"
        >
          <q-badge>{{ header.headerName }}</q-badge>
          {{ header.headerData }}
        </q-item-section>
      </q-item>
    </q-list>

    {{ mailHeaderParts?.length }}
  </q-page>
</template>
