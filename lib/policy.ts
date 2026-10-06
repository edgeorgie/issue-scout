export type AiPolicy = "forbidden" | "disclosure" | "allowed" | "unknown";

const FORBID = /(no|not|don'?t|do not|never|prohibit\w*|ban\w*|forbid\w*|reject\w*|will not accept)[^.\n]{0,60}(ai|llm|chatgpt|copilot|generated|gen-?ai)|(ai|llm)[- ]generated[^.\n]{0,60}(not accepted|prohibited|banned|rejected|not allowed)/i;
const DISCLOSE = /(disclos\w*|declare|mention|indicate|label)[^.\n]{0,80}(ai|llm|assistant|generated)|(ai|llm)[^.\n]{0,60}(disclos\w*|must be (noted|declared|labell?ed))/i;
const MENTIONS_AI = /\b(ai|llm|copilot|chatgpt|claude|generative)\b/i;

export function detectAiPolicy(text: string | null): AiPolicy {
  if (!text) return "unknown";
  if (FORBID.test(text)) return "forbidden";
  if (DISCLOSE.test(text)) return "disclosure";
  if (MENTIONS_AI.test(text)) return "allowed";
  return "unknown";
}
