<script setup lang="ts">
import { ref } from 'vue';

import { exampleHeader } from '@/helpers/exampleHeader';
import { links } from '@/helpers/links';

interface Props {
  /** The pasted text contains no header fields */
  invalid?: boolean;
}

defineProps<Props>();

const mailHeader = defineModel<string | undefined>();

const canReadClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.readText;
const clipboardMessage = ref<string>();

// The analysis starts after pasting or leaving the field, not while typing
function commit(event: Event): void {
  mailHeader.value = (event.target as HTMLTextAreaElement).value;
}

function commitAfterPaste(event: Event): void {
  // The pasted text is in the field after the event
  setTimeout(() => commit(event));
}

async function pasteFromClipboard(): Promise<void> {
  clipboardMessage.value = undefined;

  try {
    const text = await navigator.clipboard.readText();
    if (text.trim()) {
      mailHeader.value = text;
    } else {
      clipboardMessage.value = 'The clipboard is empty. Copy the email header first.';
    }
  } catch {
    clipboardMessage.value =
      'Your browser did not allow access to the clipboard. Click into the field and paste with Ctrl + V.';
  }
}
</script>

<template>
  <div class="start">
    <section class="start-intro">
      <h1 class="start-title">Where does this email really come from?</h1>
      <p class="start-text">
        Paste the header of an email. You will see who sent it, which servers it passed and whether
        it is authentic.
      </p>

      <ol class="start-steps">
        <li>
          <span class="start-number" aria-hidden="true">1</span>
          <span>
            <strong>Copy the header</strong> in Gmail or Outlook.
            <a :href="links.guide" target="_blank" rel="noopener">Show me how</a>
          </span>
        </li>
        <li>
          <span class="start-number" aria-hidden="true">2</span>
          <span><strong>Paste it</strong> into the field.</span>
        </li>
        <li>
          <span class="start-number" aria-hidden="true">3</span>
          <span><strong>Read the result.</strong> It appears right away.</span>
        </li>
      </ol>

      <div class="start-privacy">
        <q-icon name="lock_outline" size="20px" aria-hidden="true" />
        <span>
          <strong>Your data stays with you.</strong> The header is analyzed in your browser. This
          page cannot send it anywhere.
        </span>
      </div>
    </section>

    <section class="eha-card start-input">
      <label for="header-input" class="start-label">Email header</label>
      <textarea
        id="header-input"
        :value="mailHeader"
        rows="14"
        spellcheck="false"
        class="eha-input start-textarea"
        :aria-invalid="invalid"
        aria-describedby="header-input-message"
        @change="commit"
        @paste="commitAfterPaste"
        placeholder="Received: from mail.example.com (mail.example.com [192.0.2.48])
        by mx.example.org with ESMTPS id abc123;
        Tue, 24 Nov 2026 09:12:05 +0000
From: Sender <info@example.com>
Subject: …"
      ></textarea>

      <p id="header-input-message" class="start-message" role="status">
        <template v-if="invalid">
          This text contains no header fields. A header consists of lines like "From:
          info@example.com".
        </template>
        <template v-else-if="clipboardMessage">{{ clipboardMessage }}</template>
      </p>

      <div class="start-actions">
        <button
          v-if="canReadClipboard"
          type="button"
          class="eha-button eha-button-primary"
          @click="pasteFromClipboard"
        >
          Paste from clipboard
        </button>
        <button
          type="button"
          class="eha-button-link start-example"
          @click="mailHeader = exampleHeader"
        >
          Try with an example
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.start {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 48px;
  padding-top: 28px;
}

.start-intro {
  flex: 1 1 380px;
  min-width: 0;
}

.start-title {
  margin: 0 0 16px;
  color: var(--eha-ink);
  font-size: 48px !important;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.08 !important;
}

.start-text {
  max-width: 40ch;
  margin: 0 0 28px;
  color: var(--eha-ink-soft);
  font-size: 18px;
}

.start-steps {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0 0 28px;
  padding: 0;
  list-style: none;
}

.start-steps li {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.start-number {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--eha-ink);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.start-privacy {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: var(--eha-accent-tint);
  color: var(--eha-accent-dark);
  font-size: 14px;
}

.start-privacy .q-icon {
  flex: none;
  margin-top: 1px;
}

.start-input {
  flex: 1.2 1 440px;
  padding: 20px;
}

.start-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.start-textarea {
  display: block;
  min-height: 340px;
  padding: 14px;
  font-family: var(--eha-mono);
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}

.start-textarea[aria-invalid='true'] {
  border-color: var(--eha-failed);
}

.start-message {
  min-height: 0;
  margin: 8px 0 0;
  color: var(--eha-failed);
  font-size: 14px;
}

.start-message:empty {
  display: none;
}

.start-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}

.start-example {
  min-height: 48px;
  font-size: 15px;
}

@media (max-width: 599px) {
  .start {
    gap: 24px;
    padding-top: 8px;
  }

  .start-title {
    font-size: 32px !important;
    line-height: 1.12 !important;
  }

  .start-text {
    margin-bottom: 20px;
    font-size: 16px;
  }

  .start-textarea {
    min-height: 220px;
  }
}
</style>
