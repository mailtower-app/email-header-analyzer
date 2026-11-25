<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import { useQuasar } from 'quasar';

interface Props {
  title: string;
}

defineProps<Props>();

const $q = useQuasar();
const id = useId();

// On a phone the card is closed until the user opens it, on larger screens it is always open
const isCollapsible = computed(() => $q.screen.lt.sm);
const isOpenedByUser = ref(false);
const isOpen = computed(() => !isCollapsible.value || isOpenedByUser.value);
</script>

<template>
  <section class="eha-card collapsible" :class="{ 'is-closed': !isOpen }" :aria-labelledby="id">
    <div class="collapsible-header">
      <div class="collapsible-heading">
        <h2 :id="id" class="eha-card-title">
          <button
            v-if="isCollapsible"
            type="button"
            class="collapsible-toggle"
            :aria-expanded="isOpen"
            @click="isOpenedByUser = !isOpenedByUser"
          >
            {{ title }}
            <q-icon :name="isOpen ? 'expand_less' : 'expand_more'" size="22px" aria-hidden="true" />
          </button>
          <template v-else>{{ title }}</template>
        </h2>
        <p v-if="isOpen && $slots.hint" class="eha-card-hint"><slot name="hint" /></p>
      </div>
      <div v-if="isOpen && $slots.aside" class="collapsible-aside"><slot name="aside" /></div>
    </div>
    <div v-if="isOpen" class="collapsible-content"><slot /></div>
  </section>
</template>

<style scoped>
.collapsible-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.collapsible-heading {
  min-width: 0;
}

.collapsible-aside {
  flex: 0 1 320px;
  min-width: 200px;
}

.collapsible-content {
  margin-top: 16px;
}

.collapsible-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.collapsible-toggle:focus-visible {
  outline: 2px solid var(--eha-accent);
  outline-offset: 4px;
}

@media (max-width: 599px) {
  .collapsible.is-closed {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .collapsible-heading,
  .collapsible-aside {
    flex: 1 1 100%;
  }

  .collapsible .eha-card-title {
    margin: 0;
    font-size: 16px;
  }
}
</style>
