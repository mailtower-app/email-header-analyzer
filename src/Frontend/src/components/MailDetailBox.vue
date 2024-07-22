<script setup lang="ts">

interface Props {
  name: string
  details?: string[]
  preformatted: boolean
}

withDefaults(defineProps<Props>(), {
  details: undefined,
  preformatted: false
})

</script>

<template>
  <div class="row">
    <div class="col-2 bg-grey-4 q-pa-sm">
      {{ name }}
    </div>
    <div class="col-10 q-pa-sm bg-grey text-white">
      <div
        v-for="(detail, index) in details"
        :key="`detail-${index}`"
        :class="index > 0 ? 'q-mt-lg' : undefined"
      >
        <template v-if="preformatted">
          <pre style="margin: 0px; word-wrap: break-word; white-space: break-spaces;">{{ detail }}</pre>
        </template>
        <template v-else>
          <div style="font-family: monospace; word-wrap: break-word; white-space: break-spaces;">
            {{ detail }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
