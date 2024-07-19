<script setup lang="ts">
import { QTableProps } from 'quasar'

import { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts'

interface Props {
  receivedHeaders: ReceivedHeaderParts[]
}

defineProps<Props>()

const columns : QTableProps['columns'] = [
  {
    name: 'dateTime',
    align: 'left',
    label: 'Time',
    field: 'dateTime',
    sortable: false
  },
  {
    name: 'fromDomain',
    align: 'left',
    label: 'From Domain',
    field: 'fromDomain',
    sortable: false
  },
  {
    name: 'fromIpAddress',
    align: 'left',
    label: 'From IpAddress',
    field: 'fromIpAddress',
    sortable: false
  },
  {
    name: 'byDomain',
    align: 'left',
    label: 'By Domain',
    field: 'byDomain',
    sortable: false
  },
  {
    name: 'byIpAddress',
    align: 'left',
    label: 'By IpAddress',
    field: 'byIpAddress',
    sortable: false
  },
  {
    name: 'with',
    align: 'left',
    label: 'With',
    field: 'with',
    sortable: false
  },
  {
    name: 'id',
    align: 'left',
    label: 'Id',
    field: 'id',
    sortable: false
  },
  {
    name: 'for',
    align: 'left',
    label: 'For',
    field: 'for',
    sortable: false
  }
]

</script>

<template>
  <q-table
    flat

    bordered
    :rows="receivedHeaders"
    :columns="columns"
    :rows-per-page-options="[0]"

    no-paginate
  >
    <template #body-cell-dateTime="props">
      <q-td>
        {{ props.row.dateTime.toISOString() }}
      </q-td>
    </template>
  </q-table>
</template>
