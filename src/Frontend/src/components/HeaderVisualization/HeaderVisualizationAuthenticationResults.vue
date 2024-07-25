<script setup lang="ts">
import { computed } from 'vue'

import DataSection from './DataSection.vue'

interface Props {
  detail: string
}

interface SpfAuthenticationResult {
  status?: string
  details?: string
  authenticationSource?: string
  authenticationData?: string
  showError: boolean
}

interface DkimAuthenticationResult {
  status?: string
  details?: string
  headerDomain?: string
  showError: boolean
}

interface DmarcAuthenticationResult {
  status?: string
  action?: string
  headerFrom?: string
  showError: boolean
}

interface CompAuthResult {
  status?: string
  reason?: string
  showError: boolean
}

interface FullResult {
  spf?: SpfAuthenticationResult
  dkims?: DkimAuthenticationResult[]
  dmarc?: DmarcAuthenticationResult
  compAuth?: CompAuthResult
}

const props = defineProps<Props>()

const fullResult = computed<FullResult>(() => {
  const results = props.detail.split(';').map(o => o.trim())

  const spfResult : SpfAuthenticationResult = { showError: false }
  const dkimResults : DkimAuthenticationResult[] = []
  const dmarcResult : DmarcAuthenticationResult = { showError: false }
  const compAuthResult : CompAuthResult = { showError: false }

  for (const result of results) {
    if (result.startsWith('spf=')) {
      const regex = /spf=(?<status>[a-z]+)\s\((?<details>[A-Za-z0-9.:\-@ ]+)\)\ssmtp\.(?<authenticationSource>[A-Za-z]+)=(?<authenticationData>[A-Za-z0-9\-.@]+)/
      const match = result.match(regex)

      spfResult.status = match?.groups?.status
      spfResult.details = match?.groups?.details
      spfResult.authenticationSource = match?.groups?.authenticationSource
      spfResult.authenticationData = match?.groups?.authenticationData
      continue
    }

    if (result.startsWith('dkim=')) {
      const regex = /dkim=(?<status>[a-z]+)\s(\((?<details>[A-Za-z0-9. ]+)\)\s)?header\.(i|d)=(?<headerd>[A-Za-z0-9\-.@]+)/
      const match = result.match(regex)
      console.log(result)

      const dkimResult : DkimAuthenticationResult = { showError: false }
      dkimResult.status = match?.groups?.status
      dkimResult.details = match?.groups?.details
      dkimResult.headerDomain = match?.groups?.headerd

      dkimResults.push(dkimResult)

      continue
    }

    if (result.startsWith('dmarc=')) {
      const regex = /dmarc=(?<status>[a-z]+)\saction=(?<action>[A-Za-z0-9 .]+)\sheader\.from=(?<headerfrom>[A-Za-z0-9-.]+)/
      const match = result.match(regex)

      if (match) {
        dmarcResult.status = match?.groups?.status
        dmarcResult.action = match?.groups?.action
        dmarcResult.headerFrom = match?.groups?.headerfrom
        continue
      }
    }

    if (result.startsWith('dmarc=')) {
      const regex = /dmarc=(?<status>[a-z]+)\s\((?<action>[A-Za-z0-9.= ]+)\)\sheader\.from=(?<headerfrom>[A-Za-z0-9-.]+)/
      const match = result.match(regex)

      dmarcResult.status = match?.groups?.status
      dmarcResult.action = match?.groups?.action
      dmarcResult.headerFrom = match?.groups?.headerfrom
      continue
    }

    if (result.startsWith('compauth=')) {
      const regex = /compauth=(?<status>[a-z]+)\sreason=(?<reason>[A-Za-z0-9 .]+)/
      const match = result.match(regex)

      compAuthResult.status = match?.groups?.status
      compAuthResult.reason = match?.groups?.reason
      continue
    }
  }

  if (spfResult.status !== 'pass') {
    spfResult.showError = true
  }

  for (const dkimResult of dkimResults) {
    if (dkimResult.status !== 'pass') {
      dkimResult.showError = true
    }
  }

  if (dmarcResult.status !== 'pass') {
    dmarcResult.showError = true
  }

  if (compAuthResult.status !== 'pass') {
    compAuthResult.showError = true
  }

  return {
    spf: spfResult,
    dkims: dkimResults,
    dmarc: dmarcResult,
    compAuth: compAuthResult
  }
})

</script>

<template>
  <div class="row q-col-gutter-sm">
    <div class="col-12 col-lg-6">
      <q-card
        bordered
        flat
      >
        <q-card-section class="q-pa-sm">
          <q-icon
            v-if="fullResult.spf?.showError"
            name="warning"
            color="red"
            size="sm"
          /> SPF
        </q-card-section>
        <DataSection>
          <template #name>
            Status
          </template><template #value>
            {{ fullResult.spf?.status }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            Details
          </template><template #value>
            {{ fullResult.spf?.details }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            Source: {{ fullResult.spf?.authenticationSource }}
          </template><template #value>
            {{ fullResult.spf?.authenticationData }}
          </template>
        </DataSection>
      </q-card>
    </div>

    <div
      v-for="(dkimResult, index) in fullResult.dkims"
      :key="`dkimResult${index}` "
      class="col-12 col-lg-6"
    >
      <q-card
        bordered
        flat
      >
        <q-card-section class="q-pa-sm">
          <q-icon
            v-if="dkimResult?.showError"
            name="warning"
            color="red"
            size="sm"
          /> DKIM
        </q-card-section>

        <DataSection>
          <template #name>
            Status
          </template><template #value>
            {{ dkimResult?.status }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            Details
          </template><template #value>
            {{ dkimResult?.details }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            HeaderDomain
          </template><template #value>
            {{ dkimResult?.headerDomain }}
          </template>
        </DataSection>
      </q-card>
    </div>

    <div class="col-12 col-lg-6">
      <q-card
        bordered
        flat
      >
        <q-card-section class="q-pa-sm">
          <q-icon
            v-if="fullResult.dmarc?.showError"
            name="warning"
            color="red"
            size="sm"
          /> DMARC
        </q-card-section>

        <DataSection>
          <template #name>
            Status
          </template><template #value>
            {{ fullResult.dmarc?.status }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            Action
          </template><template #value>
            {{ fullResult.dmarc?.action }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            HeaderFrom
          </template><template #value>
            {{ fullResult.dmarc?.headerFrom }}
          </template>
        </DataSection>
      </q-card>
    </div>

    <div
      v-if="fullResult.compAuth?.status"
      class="col-12 col-lg-6"
    >
      <q-card
        bordered
        flat
      >
        <q-card-section class="q-pa-sm">
          <q-icon
            v-if="fullResult.compAuth?.showError"
            name="warning"
            color="red"
            size="sm"
          /> CompAuth
        </q-card-section>

        <DataSection>
          <template #name>
            Status
          </template><template #value>
            {{ fullResult.compAuth?.status }}
          </template>
        </DataSection>
        <DataSection>
          <template #name>
            Reason
          </template><template #value>
            {{ fullResult.compAuth?.reason }}
          </template>
        </DataSection>
      </q-card>
    </div>
  </div>
</template>
