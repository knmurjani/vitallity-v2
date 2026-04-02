import { getClient } from "./client";

export async function callHaiku(systemPrompt: string, userMessage: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await getClient().messages.create({
      model: "claude_haiku_4_5",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }, { signal: controller.signal });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  } catch (err) {
    console.error("[Haiku error]", err);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
