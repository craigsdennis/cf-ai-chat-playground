<script setup>
const { data: systemPromptOptions, pending: pendingSystemPromptOptions } =
  await useFetch("/api/system-prompts");
console.dir(systemPromptOptions);
const models = [
  "@cf/meta/llama-2-7b-chat-int8",
  "@cf/meta/llama-2-7b-chat-fp16",
];
const uiState = reactive({
  isSubmitting: false,
  isChatting: false,
});
const state = reactive({
  model: models[0],
  systemMessage: "You are a helpful assistant",
  userPrompt: "",
  messages: [],
});

// TODO: Break this out
async function onSubmit(event) {
  console.log(`Client side onSubmit`);
  uiState.isSubmitting = true;
  uiState.isChatting = true;
  const response = await $fetch("/api/prompt", {
    method: "POST",
    body: state,
  });
  state.messages.push({ role: "user", content: state.userPrompt });
  state.userPrompt = "";
  console.log(`Got back ${JSON.stringify(response)}`);
  state.messages.push(response);
  uiState.isSubmitting = false;
}
function onReset() {
  console.log("Resetting forms");
  const toast = useToast();
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
</script>

<template>
  <h1>AI Chat Playground</h1>
  <div class="grid grid-cols-12 gap-10">
    <!-- Options -->
    <div class="col-span-3">
      <UContainer>
        <UForm :state="state">
          <UFormGroup label="Model">
            <USelect v-model="state.model" :options="models"></USelect>
          </UFormGroup>
          <UFormGroup label="System Message">
            <UTextarea v-model="state.systemMessage"></UTextarea>
          </UFormGroup>
          <UButton
            label="♻️ Reset"
            v-if="uiState.isChatting"
            @click="onReset"
          ></UButton>
          <UCommandPalette
            label="Sample System Prompts"
            @update:model-value="chooseSystemPrompt"
            :autoselect="false"
            v-if="!pendingSystemPromptOptions"
            :groups="systemPromptOptions"
          />
        </UForm>
      </UContainer>
    </div>
    <div class="col-span-7">
      <div class="grid grid-rows-12">
        <div class="row-span-9">
          <UContainer>
            <UCard v-for="message in state.messages">
              <!-- TODO: icons -->
              <span v-text="message.role === 'user' ? '👨' : '🤖'"></span>
              {{ message.content }}
            </UCard>
          </UContainer>
        </div>
        <div class="row-span-3">
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
        </div>
      </div>
    </div>
  </div>
  <UNotifications />
</template>
