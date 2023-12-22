import { Ai } from '@cloudflare/ai';

export default defineEventHandler(async (event) => {
  console.dir(event.context);
  const ai = new Ai(event.context.cloudflare.env.AI);
  const body = await readBody(event);
  const messages = [
    { role: "system", content: body.systemMessage },
    ...body.messages,
    { role: "user", content: body.userPrompt },
  ];
  console.log(`Sending ${JSON.stringify(messages)} to ${body.model}`);
  const response = await ai.run(body.model, { messages });
  console.log(`Received ${JSON.stringify(response)}`);
  return {role: "assistant", content: response.response};
});
