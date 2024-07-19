<script setup lang="ts">
import { computed } from 'vue'
import { QTableProps } from 'quasar'

import { ReceivedHeaderParts } from 'src/models/ReceivedHeaderParts'

interface Props {
  receivedHeaders: ReceivedHeaderParts[]
}

const myProps = defineProps<Props>()

const delays = computed(() => {
  const differences: (number | undefined)[] = []

  differences.push(undefined)

  for (let i = 1; i < myProps.receivedHeaders.length; i++) {
    const previousDate = myProps.receivedHeaders[i - 1].dateTime
    const currentDate = myProps.receivedHeaders[i].dateTime

    if (!previousDate || !currentDate) {
      differences.push(0)
      continue
    }

    const diffInMs = currentDate.getTime() - previousDate.getTime()
    const diffInMinutes = diffInMs / 1000

    differences.push(diffInMinutes)
  }

  return differences
})

const columns : QTableProps['columns'] = [
  {
    name: 'dateTime',
    align: 'left',
    label: 'Time',
    field: 'dateTime',
    sortable: false
  },
  {
    name: 'delay',
    align: 'left',
    label: 'Delay',
    field: 'delay',
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
    name: 'via',
    align: 'left',
    label: 'Via',
    field: 'via',
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
    <template #body-cell-delay="props">
      <q-td>
        <template v-if="delays[props.rowIndex] !== undefined">
          {{ delays[props.rowIndex].toFixed(1) }}s
        </template>
      </q-td>
    </template>
  </q-table>
</template>
