<script setup>
import { fetchEventSource } from "@microsoft/fetch-event-source";
import hljs from "highlight.js";
import "highlight.js/styles/nord.css";

const toast = useToast();

const { data: systemPromptOptions, pending: pendingSystemPromptOptions } =
  await useFetch("/api/system-prompts");

const models = [
  "@cf/meta/llama-2-7b-chat-int8",
  "@cf/meta/llama-2-7b-chat-fp16",
];
const uiState = reactive({
  isSubmitting: false,
  isChatting: false,
  isSettingsOpen: false,
  isStreamingResponse: false,
});
const state = reactive({
  model: models[0],
  systemMessage: "You are a helpful assistant",
  userPrompt: "",
  messages: [],
});

function onChatResponseCompleted() {
  hljs.highlightAll();
}

async function onSubmit(event) {
  console.log(`Client side onSubmit`);
  uiState.isSubmitting = true;
  uiState.isChatting = true;
  await fetchEventSource("/api/prompt", {
    method: "POST",
    body: JSON.stringify(state),
    headers: {
      "Content-Type": "application/json",
    },
    openWhenHidden: true,
    onopen: async (response) => {
      console.log(`onOpen`);
      console.dir(response);
      state.messages.push({ role: "user", content: state.userPrompt });
      state.messages.push({ role: "assistant", content: "" });
      uiState.isStreamingResponse = true;
    },
    onmessage: async (msg) => {
      if (msg.data === "[DONE]") {
        onChatResponseCompleted();
        uiState.isStreamingResponse = false;
        uiState.isSubmitting = false;
      } else {
        // Adding a token at a time
        const data = JSON.parse(msg.data);
        state.messages[state.messages.length - 1].content += data.response;
      }
    },
  });
  state.userPrompt = "";
}
function onReset() {
  console.log("Resetting forms");
  toast.add({ title: "Reset", description: "The chat has been reset" });
  uiState.isChatting = false;
  uiState.isSubmitting = false;
  state.model = "";
  state.messages = [];
  state.systemMessage = "";
  state.userPrompt = "";
}

function chooseSystemPrompt(option) {
  console.log(`Option ${option} chosen`);
  console.dir(option);
  state.systemMessage = option.prompt;
}

function openSettings() {
  console.log("Attempting to open settings");
  uiState.isSettingsOpen = true;
}
onMounted(() => {
  openSettings();
});
</script>

<template>
  <div>
    <h1>AI Chat Playground</h1>
    <p>
      An exploration of
      <a href="https://developers.cloudflare.com/workers-ai/"
        >Cloudflare Workers AI</a
      >
      chat models.
    </p>
    <UButton
      icon="i-ri-chat-settings-line"
      @click="openSettings"
      label="Open Settings"
    />
    <div>
      <USlideover v-model="uiState.isSettingsOpen" :transition="false">
        <UCard>
          <template #header> Settings </template>
          <UForm :state="state">
            <UFormGroup label="Model">
              <USelect v-model="state.model" :options="models"></USelect>
            </UFormGroup>
            <UFormGroup label="System Message">
              <UTextarea v-model="state.systemMessage" :rows="10"></UTextarea>
            </UFormGroup>
          </UForm>
          <template #footer>
            <UButton
              icon="i-ri-delete-bin-6-line"
              label="Reset"
              v-if="uiState.isChatting"
              @click="onReset"
            ></UButton>
          </template>
        </UCard>
        <UCard>
          <template #header> Choose from existing System Prompts </template>
          <UCommandPalette
            label="Sample System Prompts"
            @update:model-value="chooseSystemPrompt"
            :autoselect="false"
            v-if="!pendingSystemPromptOptions"
            :groups="systemPromptOptions"
          />
        </UCard>
      </USlideover>
    </div>
    <UContainer>
      <UCard v-for="(message, index) in state.messages">
        <UAvatar
          v-if="message.role === 'user'"
          icon="i-ri-chat-1-fill"
          size="lg"
        />
        <UAvatar
          v-else-if="
            uiState.isStreamingResponse && index === state.messages.length - 1
          "
          icon="i-ri-robot-3-line"
          size="lg"
        />
        <UAvatar v-else icon="i-ri-robot-3-fill" size="lg" />
        <div v-html="$mdRenderer.render(message.content)" />
      </UCard>
    </UContainer>
    <UContainer>
      <UCard>
        <UForm :state="state" @submit="onSubmit">
          <UFormGroup help="Chat with AI">
            <UButtonGroup>
              <UTextarea
                autoresize
                v-model="state.userPrompt"
                :disabled="uiState.isSubmitting"
              ></UTextarea>
              <UButton
                icon="i-ri-chat-1-line"
                type="submit"
                default
                :disabled="uiState.isSubmitting"
              ></UButton>
            </UButtonGroup>
          </UFormGroup>
        </UForm>
      </UCard>
    </UContainer>
    <UNotifications />
  </div>
</template>
