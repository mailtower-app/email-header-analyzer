<script setup lang="ts">

</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>
          <span style="font-weight: 600;">MAILTOWER</span> - E-Mail Header Analyzer
        </q-toolbar-title>

        <q-btn
          stretch
          flat
          href="https://mailtower.app"
        >
          Mailtower.app
        </q-btn>

        <q-btn
          stretch
          flat
          href="https://github.com/mailtower-app/email-header-analyzer"
        >
          GitHub
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
