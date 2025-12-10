<script setup lang="ts"></script>

<template>
  <q-page padding>
    <div class="row justify-center intro">
      <div class="col-12 col-md-8 col-lg-6 q-mt-md">
        <h1>E-Mail Header Analyzer</h1>

        <div class="q-py-xl">
          <div class="row q-col-gutter-xl">
            <div class="col-12 col-sm-5">
              <p>
                This tool allows you to analyze email headers directly in your browser, ensuring
                complete privacy and security. No data is sent to any server; all processing is done
                locally on your device. Simply paste the email header into the input field, and the
                analysis will be performed securely within your browser. No sensitive information is
                shared externally.
              </p>
            </div>
            <div class="col-12 col-sm-7">
              <q-list bordered separator>
                <q-item>
                  <q-item-section avatar>
                    <q-avatar color="grey" text-color="white" icon="security" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Full Privacy</q-item-label>
                    <q-item-label caption>
                      No data is sent to external servers; all analysis happens locally in your
                      browser.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-avatar color="grey" text-color="white" icon="shield_locked" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Security</q-item-label>
                    <q-item-label caption>
                      Sensitive email information is kept on your device, ensuring no risk of data
                      leakage.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-avatar color="grey" text-color="white" icon="speed" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Fast Performance</q-item-label>
                    <q-item-label caption>
                      Analysis is quick, as no server communication is required.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-avatar color="grey" text-color="white" icon="accessibility" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Easy to Use</q-item-label>
                    <q-item-label caption>
                      Simply paste the email header, and the tool instantly provides insights.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-avatar color="grey" text-color="white" icon="desktop_windows" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>No Installation Required</q-item-label>
                    <q-item-label caption>
                      Works directly in your browser without the need for additional software.
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item>
                  <q-item-section avatar>
                    <q-avatar color="grey" text-color="white" icon="public" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Open Source</q-item-label>
                    <q-item-label caption>
                      The tool's source code is publicly available, allowing users to verify its
                      security and contribute to its development.
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </div>

        <q-btn :to="{ name: 'analyzer' }" class="full-width" unelevated color="primary" size="xl">
          Analyze Header
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.intro {
  font-size: 1.1rem;
  line-height: 1.7rem;
}
</style>
