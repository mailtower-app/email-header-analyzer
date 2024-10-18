<script setup lang="ts">

</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title
          shrink
          style="min-width:120px;"
        >
          <router-link
            :to="{ name: 'home' }"
            class="brand-name"
          >
            MAILTOWER
          </router-link>
        </q-toolbar-title>

        <q-item
          stretch
          flat
          :to="{name: 'analyzer'}"
          active-class="text-white bg-menu-active"
        >
          <q-item-section class="text-uppercase text-weight-medium">
            E-Mail Header Analyzer
          </q-item-section>
        </q-item>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="text-center bg-grey-2 text-black q-pa-xl">
      <q-btn
        stretch
        flat
        href="https://mailtower.app"
        size="md"
      >
        Mailtower.app
      </q-btn>

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
.brand-name {
  color: #fff;
  text-decoration: none;
  font-weight:600;
}

.bg-menu-active {
  background-color: #539CC5;
}
</style>
