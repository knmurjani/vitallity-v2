import { getClient } from "./client";

export async function callOpus(systemPrompt: string, userMessage: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);
  try {
    const response = await getClient().messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }, { signal: controller.signal });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  } catch (err) {
    console.error("[Opus error]", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
