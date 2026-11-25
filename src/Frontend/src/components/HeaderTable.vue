<script setup lang="ts">
import { computed, ref } from 'vue';

import type { HeaderDetails } from '@/models/HeaderDetails';

import CollapsibleCard from '@/components/CollapsibleCard.vue';

interface Props {
  headers: HeaderDetails[];
}

const props = defineProps<Props>();

// Long header values are shortened until the user expands them
const maxDataLength = 160;

const filter = ref('');
const expandedHeaders = ref<number[]>([]);

const filteredHeaders = computed(() => {
  const filterTerm = filter.value.trim().toLowerCase();
  if (!filterTerm) {
    return props.headers;
  }

  return props.headers.filter(
    (header) =>
      header.headerName.toLowerCase().includes(filterTerm) ||
      header.headerData.toLowerCase().includes(filterTerm),
  );
});

const rows = computed(() => {
  return filteredHeaders.value.map((header) => {
    const isLong = header.headerData.length > maxDataLength;
    const isExpanded = expandedHeaders.value.includes(header.headerIndex);

    return {
      header,
      isLong,
      isExpanded,
      data:
        isLong && !isExpanded ? `${header.headerData.slice(0, maxDataLength)}…` : header.headerData,
    };
  });
});

function toggleExpanded(headerIndex: number): void {
  if (expandedHeaders.value.includes(headerIndex)) {
    expandedHeaders.value = expandedHeaders.value.filter((index) => index !== headerIndex);
  } else {
    expandedHeaders.value = [...expandedHeaders.value, headerIndex];
  }
}
</script>

<template>
  <CollapsibleCard :title="`All headers · ${headers.length} fields`">
    <template #hint>
      <template v-if="filteredHeaders.length === headers.length">
        In the order of the email.
      </template>
      <template v-else>{{ filteredHeaders.length }} of {{ headers.length }} fields match.</template>
    </template>
    <template #aside>
      <label for="header-search" class="eha-sr-only">Search headers</label>
      <input
        id="header-search"
        v-model="filter"
        type="search"
        placeholder="Search name or value"
        class="eha-input headers-search-input"
      />
    </template>

    <div class="headers-scroll">
      <table class="headers-table">
        <thead>
          <tr>
            <th scope="col" class="headers-index">#</th>
            <th scope="col" class="headers-name">NAME</th>
            <th scope="col">VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.header.headerIndex">
            <td class="headers-index eha-muted">{{ row.header.headerIndex + 1 }}</td>
            <td class="headers-name">{{ row.header.headerName }}</td>
            <td class="headers-value">
              {{ row.data }}
              <button
                v-if="row.isLong"
                type="button"
                class="eha-button-link headers-toggle"
                :aria-expanded="row.isExpanded"
                @click="toggleExpanded(row.header.headerIndex)"
              >
                {{ row.isExpanded ? 'Show less' : 'Show all' }}
              </button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="3" class="eha-muted headers-empty">No header matches the search.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </CollapsibleCard>
</template>

<style scoped>
.headers-search-input {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 8px;
  background: var(--eha-surface);
  font-size: 14px;
}

.headers-scroll {
  overflow-x: auto;
}

.headers-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-family: var(--eha-mono);
  font-size: 13px;
}

.headers-table th {
  padding: 8px 12px;
  color: var(--eha-muted);
  font-family: Roboto, sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
}

.headers-table td {
  padding: 10px 12px;
  border-top: 1px solid var(--eha-line-soft);
  vertical-align: top;
}

.headers-table .headers-index {
  width: 44px;
  padding-left: 0;
}

.headers-table .headers-name {
  width: 220px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.headers-value {
  padding-right: 0;
  overflow-wrap: anywhere;
}

.headers-toggle {
  min-height: 24px;
  font-family: Roboto, sans-serif;
  font-size: 13px;
}

.headers-empty {
  font-family: Roboto, sans-serif;
  font-size: 14px;
}

/* On a phone every header is a block: the name above the value */
@media (max-width: 599px) {
  .headers-table {
    min-width: 0;
  }

  .headers-table thead,
  .headers-table .headers-index {
    display: none;
  }

  .headers-table tr {
    display: block;
    padding: 10px 0;
    border-top: 1px solid var(--eha-line-soft);
  }

  .headers-table td {
    display: block;
    width: auto;
    padding: 0;
    border-top: 0;
  }

  .headers-table .headers-name {
    width: auto;
    font-weight: 700;
  }
}
</style>
