import { getClient } from "./client";

export async function callSonnet(systemPrompt: string, messages: { role: string; content: string }[]): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: messages as any,
    }, { signal: controller.signal });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  } catch (err) {
    console.error("[Sonnet error]", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
