<template>
  <div class="fullscreen bg-black text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 15vh; height: 18vh">404</div>

      <div class="text-h2" style="opacity: 0.4">The letter carrier must have lost something</div>

      <q-btn
        class="q-mt-xl q-px-xl"
        outline
        unelevated
        :to="{ name: 'home', params: { lang: 'de' } }"
        label="Go to Home"
        no-caps
      />
    </div>
  </div>
</template>

<script setup lang="ts"></script>
