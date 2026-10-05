"use client";

import { PROVIDERS, type Provider } from "@/lib/llm";

export type LlmConfig = { provider: Provider; key: string };

export function loadConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem("llm-config");
    if (raw) return JSON.parse(raw) as LlmConfig;
  } catch {
    // storage unavailable: fall back to defaults
  }
  return { provider: "anthropic", key: "" };
}

export default function LlmSettings({ value, onChange }: { value: LlmConfig; onChange: (c: LlmConfig) => void }) {
  function set(c: LlmConfig) {
    try {
      localStorage.setItem("llm-config", JSON.stringify(c));
    } catch {
      // storage unavailable: keep in memory only
    }
    onChange(c);
  }
  return (
    <details className="mt-4 rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-800">
      <summary className="cursor-pointer">AI analysis (optional, bring your own key)</summary>
      <p className="mt-2 text-neutral-500">The key stays in this browser and is sent only to the provider you pick.</p>
      <div className="mt-2 flex gap-2">
        <select
          value={value.provider}
          onChange={(e) => set({ ...value, provider: e.target.value as Provider })}
          className="rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
        >
          {Object.entries(PROVIDERS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <input
          type="password"
          value={value.key}
          onChange={(e) => set({ ...value, key: e.target.value })}
          placeholder="API key"
          autoComplete="off"
          className="flex-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1 dark:border-neutral-700"
        />
      </div>
    </details>
  );
}
