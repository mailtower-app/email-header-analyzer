<script setup lang="ts">
import { ref, computed } from 'vue';
import type { HeaderDetails } from 'src/models/HeaderDetails';

interface Props {
  rows: HeaderDetails[];
}

const props = defineProps<Props>();

const query = ref('');

const filtered = computed(() => {
  const term = query.value.trim().toLowerCase();
  if (!term) return props.rows;
  return props.rows.filter(
    (row) =>
      row.headerName.toLowerCase().includes(term) ||
      row.headerData.toLowerCase().includes(term),
  );
});

const copiedIndex = ref<number | null>(null);

async function copyRow(row: HeaderDetails, index: number): Promise<void> {
  try {
    await navigator.clipboard.writeText(`${row.headerName}: ${row.headerData}`);
    copiedIndex.value = index;
    setTimeout(() => (copiedIndex.value = null), 1200);
  } catch {
    // clipboard blocked — no-op
  }
}
</script>

<template>
  <div class="htable">
    <div class="search">
      <span class="ic" aria-hidden="true">&#9906;</span>
      <input
        v-model="query"
        type="text"
        placeholder="Filter headers"
        aria-label="Filter headers"
        spellcheck="false"
      />
      <span class="count">{{ filtered.length }} / {{ rows.length }}</span>
      <button
        v-if="query"
        type="button"
        class="clear"
        aria-label="Clear filter"
        @click="query = ''"
      >
        &times;
      </button>
    </div>

    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th class="c-name">Name</th>
            <th class="c-data">Value</th>
            <th class="c-idx">#</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in filtered" :key="`${row.headerName}-${row.headerIndex}`">
            <td class="hk">
              {{ row.headerName }}
              <button
                type="button"
                class="row-copy"
                :aria-label="`Copy ${row.headerName}`"
                @click="copyRow(row, index)"
              >
                {{ copiedIndex === index ? 'copied' : 'copy' }}
              </button>
            </td>
            <td class="hv">{{ row.headerData }}</td>
            <td class="hi">{{ row.headerIndex }}</td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="3" class="empty">No headers match &ldquo;{{ query }}&rdquo;</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.htable {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--panel);
}

.search {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono);
  color: var(--ink-faint);
}

.search .ic {
  font-size: 0.9rem;
}

.search input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--ink);
}

.search .count {
  font-size: 0.74rem;
  font-variant-numeric: tabular-nums;
}

.clear {
  background: transparent;
  border: none;
  color: var(--ink-faint);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;
}

.clear:hover {
  color: var(--fail);
}

.scroll {
  overflow-x: auto;
  max-height: 30rem;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--panel-2);
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-faint);
  padding: 0.5rem 0.8rem;
  border-bottom: 1px solid var(--border);
}

.c-idx {
  width: 3rem;
}
.c-name {
  width: 34%;
}

td {
  padding: 0.55rem 0.8rem;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover td {
  background: var(--panel-2);
}

.hk {
  font-family: var(--font-mono);
  color: var(--ink-muted);
  white-space: nowrap;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.row-copy {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-faint);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0 0.3rem;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease;
}

tr:hover .row-copy,
.row-copy:focus-visible {
  opacity: 1;
}

.row-copy:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 45%, transparent);
}

.hv {
  font-family: var(--font-mono);
  color: var(--ink);
  word-break: break-all;
}

.hi {
  font-family: var(--font-mono);
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.empty {
  text-align: center;
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  padding: 1.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .row-copy {
    opacity: 1;
    transition: none;
  }
}
</style>
