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
  const stream = await ai.run(body.model, { messages, stream: true });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    },
  });
});
