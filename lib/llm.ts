export type Provider = "anthropic" | "openai";

export const PROVIDERS: Record<Provider, { label: string; model: string }> = {
  anthropic: { label: "Anthropic", model: "claude-haiku-4-5-20251001" },
  openai: { label: "OpenAI", model: "gpt-4o-mini" },
};

export const SYSTEM_PROMPT =
  "You help developers pick open source issues. Reply in the user's language with: 1) a two sentence summary, 2) difficulty (easy/medium/hard) with one reason, 3) a short numbered plan of attack. Be concise.";

export function buildPrompt(repo: string, title: string, body: string) {
  return `Repository: ${repo}\nIssue: ${title}\n\n${body}`;
}

// Runs in the browser only. The key never goes through this app's server.
export async function analyze(provider: Provider, apiKey: string, prompt: string): Promise<string> {
  const model = PROVIDERS[provider].model;
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model, max_tokens: 700, system: SYSTEM_PROMPT, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw providerError("Anthropic", res.status);
    const j = (await res.json()) as { content: { type: string; text?: string }[] };
    return j.content.map((c) => c.text ?? "").join("");
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw providerError("OpenAI", res.status);
  const j = (await res.json()) as { choices: { message: { content: string } }[] };
  return j.choices[0]?.message.content ?? "";
}

export function providerError(label: string, status: number): Error {
  const hint =
    status === 401 || status === 403
      ? "Check your API key."
      : status === 429
        ? "Rate limit reached. Wait a moment and retry."
        : status >= 500
          ? "The provider is having problems. Try again later."
          : "The provider rejected the request.";
  return new Error(`${label} error ${status}. ${hint}`);
}
