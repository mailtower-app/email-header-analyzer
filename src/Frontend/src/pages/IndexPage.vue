<script setup lang="ts">
</script>

<template>
  <q-page padding>
    <div class="row justify-center intro">
      <div class="col-12 col-md-8 col-lg-6">
        <h1>E-Mail Header Analyzer</h1>
        <p class="q-pt-md">
          This tool allows you to analyze email headers directly in your browser, ensuring complete privacy and security.
          No data is sent to any server; all processing is done locally on your device. Simply paste the email header into the input field,
          and the analysis will be performed securely within your browser. No sensitive information is shared externally.
        </p>

        <q-list
          bordered
          separator
          class="q-mt-xl"
        >
          <q-item>
            <q-item-section>
              <q-item-label>Full Privacy</q-item-label>
              <q-item-label caption>
                No data is sent to external servers; all analysis happens locally in your browser.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Security</q-item-label>
              <q-item-label caption>
                Sensitive email information is kept on your device, ensuring no risk of data leakage.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Fast Performance</q-item-label>
              <q-item-label caption>
                Analysis is quick, as no server communication is required.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Easy to Use</q-item-label>
              <q-item-label caption>
                Simply paste the email header, and the tool instantly provides insights.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>No Installation Required</q-item-label>
              <q-item-label caption>
                Works directly in your browser without the need for additional software.
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Open Source</q-item-label>
              <q-item-label caption>
                The tool's source code is publicly available, allowing users to verify its security and contribute to its development.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-btn
          :to="{ name: 'analyzer' }"
          class="full-width q-mt-xl"
          color="primary"
          size="xl"
        >
          Analyze E-Mail Header
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.intro {
  font-size: 1.1rem;
  line-height: 1.5rem;
}
</style>
