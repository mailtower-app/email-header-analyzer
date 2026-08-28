<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

const THEME_KEY = 'hdr-theme';
type ThemeChoice = 'light' | 'dark' | 'auto';

function readChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  } catch {
    // storage unavailable — fall through to 'auto'
  }
  return 'auto';
}

function applyChoice(choice: ThemeChoice): void {
  $q.dark.set(choice === 'auto' ? 'auto' : choice === 'dark');
}

// Restore before first paint to avoid a light→dark flash.
onBeforeMount(() => applyChoice(readChoice()));

function toggleTheme(): void {
  const next: ThemeChoice = $q.dark.isActive ? 'light' : 'dark';
  applyChoice(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // best-effort persistence
  }
}
</script>

<template>
  <q-layout view="lHh Lpr lff">
    <q-header class="app-header">
      <q-toolbar>
        <q-toolbar-title shrink style="min-width: 120px">
          <router-link :to="{ name: 'home' }" class="brand-name"> MAILTOWER </router-link>
        </q-toolbar-title>

        <q-item stretch flat :to="{ name: 'analyzer' }" active-class="menu-active">
          <q-item-section class="text-uppercase text-weight-medium">
            E-Mail Header Analyzer
          </q-item-section>
        </q-item>

        <q-btn
          flat
          round
          dense
          class="q-ml-sm"
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :aria-label="$q.dark.isActive ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggleTheme"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="app-footer text-center q-pa-xl">
      <q-btn stretch flat href="https://mailtower.app" size="md"> Mailtower.app </q-btn>

      <q-btn
        stretch
        flat
        href="https://github.com/mailtower-app/email-header-analyzer"
        size="md"
      >
        GitHub
      </q-btn>
    </q-footer>
  </q-layout>
</template>

<style scoped>
.app-header {
  background: var(--panel-2);
  color: var(--ink);
  border-bottom: 1px solid var(--border);
}

.brand-name {
  color: var(--ink);
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.menu-active {
  background-color: var(--accent);
  color: var(--accent-contrast);
}

.app-footer {
  background: var(--panel-2);
  color: var(--ink-muted);
  border-top: 1px solid var(--border);
}

.app-footer .q-btn {
  color: var(--ink-muted);
}
</style>
