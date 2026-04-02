import Anthropic from "@anthropic-ai/sdk";

// Singleton client - credentials come from environment
let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
