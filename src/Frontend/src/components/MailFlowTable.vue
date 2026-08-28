<script setup lang="ts">
import { computed } from 'vue';
import type { QTableProps } from 'quasar';

import type { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts';
import { formatUtc, formatDuration } from 'src/helpers/dateFormat';

interface Props {
  receivedHeaders: ReceivedHeaderParts[];
}

const myProps = defineProps<Props>();

function isValidDate(d: Date | undefined): d is Date {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

/** Seconds elapsed since the previous hop, or undefined when it can't be known. */
const delays = computed<(number | undefined)[]>(() => {
  return myProps.receivedHeaders.map((hop, i) => {
    if (i === 0) return undefined;

    const previousDate = myProps.receivedHeaders[i - 1]?.dateTime;
    const currentDate = hop.dateTime;

    if (!isValidDate(previousDate) || !isValidDate(currentDate)) return undefined;

    return (currentDate.getTime() - previousDate.getTime()) / 1000;
  });
});

function delayLabel(seconds: number | undefined): string {
  return seconds === undefined ? '' : formatDuration(seconds);
}

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
        {{ formatUtc(props.row.dateTime) }}
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
        {{ delayLabel(delays[props.rowIndex]) }}
      </q-td>
    </template>
  </q-table>
</template>
