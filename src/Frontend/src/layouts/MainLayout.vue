<script setup lang="ts">

</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          Mailtower E-Mail Header Analyzer
        </q-toolbar-title>

        <authenticationResultsHeaders>Quasar v{{ $q.version }}</authenticationResultsHeaders>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
