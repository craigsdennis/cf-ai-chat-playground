<script setup>
import { fetchEventSource } from "@microsoft/fetch-event-source";

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
          uiState.isStreamingResponse = false;
          uiState.isSubmitting = false;
        } else {
          const data = JSON.parse(msg.data);
          state.messages[state.messages.length -1].content += data.response;
        }
      },
    }
  )
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

//openSettings();
</script>

<template>
  <h1>AI Chat Playground</h1>
  <div>
    <UButton label="Open Settings" @click="openSettings"></UButton>
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
            <UButton
              label="♻️ Reset"
              v-if="uiState.isChatting"
              @click="onReset"
            ></UButton>
          </UForm>
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
        <!-- TODO: icons -->
        <UAvatar v-if="message.role === 'user'" icon="i-ri-user-fill"/>
        <UAvatar v-else-if="uiState.isStreamingResponse && index === state.messages.length -1" icon="i-ri-robot-3-line" />
        <UAvatar v-else icon="i-ri-robot-3-fill" />
        {{ message.content }}
      </UCard>
    </UContainer>
    <UContainer>
      <UForm :state="state" @submit="onSubmit">
        <UFormGroup label="Prompt">
          <UTextarea
            v-model="state.userPrompt"
            :disabled="uiState.isSubmitting"
          ></UTextarea>
        </UFormGroup>
        <UButton
          label="Prompt"
          type="submit"
          :disabled="uiState.isSubmitting"
        ></UButton>
      </UForm>
    </UContainer>
    <UNotifications />
  </div>
</template>
