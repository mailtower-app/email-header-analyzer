<script setup lang="ts">
import { links } from '@/helpers/links';
</script>

<template>
  <q-layout view="lHh Lpr lff">
    <q-header>
      <div class="main-header">
        <div class="main-header-brand">
          <router-link :to="{ name: 'home' }" class="brand-name">MAILTOWER</router-link>
          <router-link
            :to="{ name: 'analyzer' }"
            class="main-header-tab"
            active-class="main-header-tab-active"
          >
            Header Analyzer
          </router-link>
        </div>
        <nav class="main-header-links gt-xs" aria-label="Help">
          <a :href="links.guide" target="_blank" rel="noopener">How to get the header</a>
          <a :href="links.github" target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="main-footer">
      <div class="main-footer-content">
        <span class="main-footer-privacy">
          <q-icon name="lock_outline" size="16px" aria-hidden="true" />
          Analyzed in your browser. Nothing is uploaded.
        </span>
        <nav class="main-footer-links" aria-label="More">
          <a :href="links.guide" target="_blank" rel="noopener" class="lt-sm">
            How to get the header
          </a>
          <a :href="links.mailtower" target="_blank" rel="noopener">Mailtower.app</a>
          <a :href="links.github" target="_blank" rel="noopener">GitHub</a>
          <span>Open source · MIT License</span>
        </nav>
      </div>
    </q-footer>
  </q-layout>
</template>

<style scoped>
.main-header {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: space-between;
  gap: 0 12px;
  max-width: 1160px;
  min-height: 50px;
  margin: 0 auto;
  padding: 0 32px;
}

.main-header-brand {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.brand-name {
  align-self: center;
  min-width: 120px;
  color: #fff;
  font-size: 21px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
}

.main-header-tab {
  display: flex;
  align-items: center;
  min-height: 50px;
  padding: 0 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  text-transform: uppercase;
}

.main-header-tab:hover,
.main-header-tab-active {
  background-color: #4b5563;
}

.main-header-links {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 14px;
}

.main-header-links a {
  padding: 12px 0;
  color: #fff;
  text-decoration: none;
}

.main-header-links a:hover {
  text-decoration: underline;
}

.main-footer {
  background: #f4f5f7;
  color: #4b5563;
  font-size: 13px;
}

.main-footer-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  max-width: 1160px;
  margin: 0 auto;
  padding: 20px 32px 28px;
}

.main-footer-privacy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.main-footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

.main-footer-links a {
  color: #4b5563;
}

.main-footer-links a:hover {
  color: #111827;
}

@media (max-width: 599px) {
  .main-header {
    padding: 0 0 0 12px;
  }

  .main-header-brand {
    gap: 12px;
  }

  .brand-name {
    min-width: 0;
  }

  .main-footer-content {
    padding: 16px 16px 24px;
  }
}
</style>
