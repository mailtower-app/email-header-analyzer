<script setup lang="ts">
import HeaderVisualizationAuthenticationResults from 'src/components/HeaderVisualization/HeaderVisualizationAuthenticationResults.vue';

interface Props {
  name: string;
  details: string[];
  preformatted: boolean;
}

withDefaults(defineProps<Props>(), {
  details: () => [],
  preformatted: false,
});
</script>

<template>
  <q-card bordered flat>
    <q-card-section class="q-pa-none" :horizontal="$q.screen.gt.xs">
      <q-card-section class="col-3 col-md-2 q-pa-sm bg-grey-2">
        {{ name }}
      </q-card-section>
      <q-card-section class="col-9 col-md-10 q-pa-sm bg-grey-1">
        <q-badge v-if="(details?.length ?? 0) > 1" floating>
          {{ details?.length }}
        </q-badge>
        <div
          v-for="(detail, index) in details"
          :key="`detail-${index}`"
          :class="index > 0 ? 'q-mt-lg' : undefined"
        >
          <template v-if="name == 'Authentication-Results'">
            <HeaderVisualizationAuthenticationResults :detail="detail" />
          </template>
          <template v-else-if="preformatted">
            <pre style="margin: 0px; word-wrap: break-word; white-space: break-spaces">{{
              detail
            }}</pre>
          </template>
          <template v-else>
            <div style="font-family: monospace; word-wrap: break-word; white-space: break-spaces">
              {{ detail }}
            </div>
          </template>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>
