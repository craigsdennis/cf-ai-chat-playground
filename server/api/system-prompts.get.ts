export default defineEventHandler(async (event) => {
  const { results } = await event.context.cloudflare.env.DB.prepare(
    "SELECT * FROM system_prompts"
  )
    .bind()
    .all();
  const commands = results.map((result: { id: any; name: any; prompt: any; }) => {
    return {
      id: result.id,
      label: result.name,
      prompt: result.prompt
    }
  });
  return [{"key": "prompts", commands}];
});
