<script setup lang="ts">
import { computed } from 'vue';
import type { QTableProps } from 'quasar';

import type { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts';

interface Props {
  receivedHeaders: ReceivedHeaderParts[];
}

const myProps = defineProps<Props>();

const delays = computed(() => {
  const differences: (number | undefined)[] = [];

  differences.push(undefined);

  for (let i = 1; i < myProps.receivedHeaders.length; i++) {
    const previousDate = myProps.receivedHeaders[i - 1]?.dateTime;
    const currentDate = myProps.receivedHeaders[i]?.dateTime;

    if (!previousDate || !currentDate) {
      differences.push(0);
      continue;
    }

    const diffInMs = currentDate.getTime() - previousDate.getTime();
    const diffInMinutes = diffInMs / 1000;

    differences.push(diffInMinutes);
  }

  return differences;
});

const columns: QTableProps['columns'] = [
  {
    name: 'dateTime',
    align: 'left',
    label: 'Time (UTC)',
    field: 'dateTime',
    sortable: false,
    style: 'min-width: 170px;',
  },
  {
    name: 'delay',
    align: 'left',
    label: 'Delay',
    field: 'delay',
    sortable: false,
  },
  {
    name: 'by',
    align: 'left',
    label: 'Receiving host (By)',
    field: 'by',
    sortable: false,
    style: 'max-width: 400px; white-space: pre-line;',
  },
  {
    name: 'from',
    align: 'left',
    label: 'Sending host (From)',
    field: 'from',
    sortable: false,
    style: 'max-width: 400px; white-space: pre-line;',
  },
  {
    name: 'via',
    align: 'left',
    label: 'Via',
    field: 'via',
    sortable: false,
    style: 'max-width: 400px; white-space: pre-line;',
  },
  {
    name: 'with',
    align: 'left',
    label: 'With',
    field: 'with',
    sortable: false,
    style: 'max-width: 400px; white-space: pre-line;',
  },
  {
    name: 'id',
    align: 'left',
    label: 'Id',
    field: 'id',
    sortable: false,
    style: 'max-width: 400px; white-space: pre-line;',
  },
  {
    name: 'for',
    align: 'left',
    label: 'For',
    field: 'for',
    sortable: false,
    style: 'max-width: 400px; white-space: pre-line;',
  },
];

function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
  };

  return new Intl.DateTimeFormat(undefined, options).format(date);
}
</script>

<template>
  <q-table
    flat
    bordered
    :rows="receivedHeaders"
    :columns="columns"
    :rows-per-page-options="[0]"
    no-paginate
    hide-bottom
  >
    <template #body-cell-dateTime="props">
      <q-td :props="props">
        {{ formatDate(props.row.dateTime) }}
      </q-td>
    </template>
    <template #body-cell-by="props">
      <q-td :props="props">
        <template v-if="props.row.byDomain">
          {{ props.row.byDomain }}<br />
          {{ props.row.byIpAddress }}
        </template>
        <template v-else>
          {{ props.row.rawHeaderDetails.headerData }}
        </template>
      </q-td>
    </template>
    <template #body-cell-from="props">
      <q-td :props="props">
        {{ props.row.fromDomain }}<br />
        {{ props.row.fromIpAddress }}
      </q-td>
    </template>
    <template #body-cell-delay="props">
      <q-td :props="props">
        <template v-if="delays[props.rowIndex] !== undefined">
          {{ delays[props.rowIndex]?.toFixed(1) }}s
        </template>
      </q-td>
    </template>
  </q-table>
</template>
