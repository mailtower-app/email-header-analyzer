<script setup lang="ts">
import { computed } from 'vue';

import type { Severity } from 'src/helpers/analysis';
import AuthCheckCard from 'src/components/AuthCheckCard.vue';
import type { AuthRow } from 'src/components/AuthCheckCard.vue';

interface Props {
  detail: string;
}

interface SpfAuthenticationResult {
  status?: string;
  details?: string;
  authenticationSource?: string;
  authenticationData?: string;
  showError: boolean;
}

interface DkimAuthenticationResult {
  status?: string;
  details?: string;
  headerDomain?: string;
  showError: boolean;
}

interface DmarcAuthenticationResult {
  status?: string;
  action?: string;
  headerFrom?: string;
  showError: boolean;
}

interface CompAuthResult {
  status?: string;
  reason?: string;
  showError: boolean;
}

interface FullResult {
  spf?: SpfAuthenticationResult | undefined;
  dkims?: DkimAuthenticationResult[];
  dmarc?: DmarcAuthenticationResult | undefined;
  compAuth?: CompAuthResult | undefined;
}

interface AuthCard {
  key: string;
  kind: string;
  status?: string | undefined;
  severity: Severity;
  rows: AuthRow[];
}

const props = defineProps<Props>();

const splitAuthResults = (input: string): string[] => {
  return input
    .split(/;(?![^(]*\))/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
};

const fullResult = computed<FullResult>(() => {
  const results = splitAuthResults(props.detail);

  let spfResult: SpfAuthenticationResult | undefined = undefined;
  const dkimResults: DkimAuthenticationResult[] = [];
  let dmarcResult: DmarcAuthenticationResult | undefined = undefined;
  let compAuthResult: CompAuthResult | undefined = undefined;

  for (const result of results) {
    if (result.startsWith('spf=')) {
      const regex =
        /spf=(?<status>[a-z]+)\s(\((?<details>[A-Za-z0-9.:\-@ ]+)\)\s)?smtp\.(?<authenticationSource>[A-Za-z]+)=(?<authenticationData>[A-Za-z0-9\-.@]+)/;
      const match = result.match(regex);

      spfResult = {
        showError: false,
        status: match?.groups?.status ?? '',
        details: match?.groups?.details ?? '',
        authenticationSource: match?.groups?.authenticationSource ?? '',
        authenticationData: match?.groups?.authenticationData ?? '',
      };

      continue;
    }

    if (result.startsWith('dkim=')) {
      const regex =
        /dkim=(?<status>[a-z]+)\s(\((?<details>[A-Za-z0-9.;\- ]+)\)\s)?header\.(i|d)=(?<headerd>[A-Za-z0-9\-.@]+)/;
      const match = result.match(regex);

      const dkimResult: DkimAuthenticationResult = { showError: false };
      dkimResult.status = match?.groups?.status ?? '';
      dkimResult.details = match?.groups?.details ?? '';
      dkimResult.headerDomain = match?.groups?.headerd ?? '';

      dkimResults.push(dkimResult);

      continue;
    }

    if (result.startsWith('dmarc=')) {
      dmarcResult = {
        showError: false,
      };

      //dmarc=pass action=none header.from=github.com;
      //dmarc=pass action=none header.from=brz.gv.at
      //dmarc=skipped
      const regex =
        /dmarc=(?<status>[a-z]+)(\saction=(?<action>[A-Za-z0-9.]+))?(\sheader\.from=(?<headerfrom>[A-Za-z0-9-.]+))?/;
      const match = result.match(regex);

      if (match) {
        dmarcResult.status = match?.groups?.status ?? '';
        dmarcResult.action = match?.groups?.action ?? '';
        dmarcResult.headerFrom = match?.groups?.headerfrom ?? '';
        continue;
      }

      //Google's format, no action field
      //dmarc=pass (p=REJECT sp=REJECT dis=NONE) header.from=config.fail
      const regex1 =
        /dmarc=(?<status>[a-z]+)\s\((?<action>[A-Za-z0-9.= ]+)\)\sheader\.from=(?<headerfrom>[A-Za-z0-9-.]+)/;
      const match1 = result.match(regex1);

      if (match1) {
        dmarcResult.status = match1?.groups?.status ?? '';
        dmarcResult.action = match1?.groups?.action ?? '';
        dmarcResult.headerFrom = match1?.groups?.headerfrom ?? '';
        continue;
      }
    }

    if (result.startsWith('compauth=')) {
      compAuthResult = {
        showError: false,
      };

      const regex = /compauth=(?<status>[a-z]+)\sreason=(?<reason>[A-Za-z0-9 .]+)/;
      const match = result.match(regex);

      compAuthResult.status = match?.groups?.status ?? '';
      compAuthResult.reason = match?.groups?.reason ?? '';
      continue;
    }
  }

  if (spfResult && spfResult.status !== 'pass') {
    spfResult.showError = true;
  }

  for (const dkimResult of dkimResults) {
    if (dkimResult.status !== 'pass') {
      dkimResult.showError = true;
    }
  }

  if (dmarcResult && dmarcResult.status !== 'pass') {
    dmarcResult.showError = true;
  }

  if (compAuthResult && compAuthResult.status !== 'pass') {
    compAuthResult.showError = true;
  }

  return {
    spf: spfResult,
    dkims: dkimResults,
    dmarc: dmarcResult,
    compAuth: compAuthResult,
  };
});

const cards = computed<AuthCard[]>(() => {
  const out: AuthCard[] = [];
  const result = fullResult.value;

  if (result.spf) {
    out.push({
      key: 'spf',
      kind: 'SPF',
      status: result.spf.status,
      severity: result.spf.showError ? 'fail' : 'pass',
      rows: [
        { label: 'Details', value: result.spf.details },
        {
          label: result.spf.authenticationSource
            ? `smtp.${result.spf.authenticationSource}`
            : 'source',
          value: result.spf.authenticationData,
        },
      ],
    });
  }

  (result.dkims ?? []).forEach((dkim, index) => {
    out.push({
      key: `dkim-${index}`,
      kind: 'DKIM',
      status: dkim.status,
      severity: dkim.showError ? 'fail' : 'pass',
      rows: [
        { label: 'Details', value: dkim.details },
        { label: 'header.d', value: dkim.headerDomain },
      ],
    });
  });

  if (result.dmarc) {
    out.push({
      key: 'dmarc',
      kind: 'DMARC',
      status: result.dmarc.status,
      severity: result.dmarc.showError ? 'fail' : 'pass',
      rows: [
        { label: 'Action', value: result.dmarc.action },
        { label: 'header.from', value: result.dmarc.headerFrom },
      ],
    });
  }

  if (result.compAuth?.status) {
    out.push({
      key: 'compauth',
      kind: 'CompAuth',
      status: result.compAuth.status,
      severity: result.compAuth.showError ? 'warn' : 'pass',
      rows: [{ label: 'Reason', value: result.compAuth.reason }],
    });
  }

  return out;
});
</script>

<template>
  <div class="auth-grid">
    <AuthCheckCard
      v-for="card in cards"
      :key="card.key"
      :kind="card.kind"
      :status="card.status"
      :severity="card.severity"
      :rows="card.rows"
    />
  </div>
</template>

<style scoped>
.auth-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.8rem;
}
</style>
