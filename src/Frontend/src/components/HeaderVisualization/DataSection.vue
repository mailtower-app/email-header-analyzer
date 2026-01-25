<template>
  <q-card-section
    class="q-pa-none"
    horizontal
  >
    <q-card-section class="col-4 q-py-xs q-px-sm bg-grey-2">
      <slot name="name" />:
    </q-card-section>
    <q-card-section
      class="col-8 q-py-xs q-px-sm bg-grey-2"
      style="word-wrap: break-word;"
    >
      <slot name="value" />
    </q-card-section>
  </q-card-section>
</template>
