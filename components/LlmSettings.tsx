"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  function set(c: LlmConfig) {
    try {
      localStorage.setItem("llm-config", JSON.stringify(c));
    } catch {
      // storage unavailable: keep in memory only
    }
    onChange(c);
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 text-[13px] font-bold transition hover:-translate-y-0.5 ${value.key ? "bg-go-soft" : "bg-card"}`}
      >
        <span className={`h-2 w-2 rounded-full ${value.key ? "bg-go" : "bg-ink-soft/40"}`} />
        {value.key ? `AI on (${PROVIDERS[value.provider].label})` : "Add AI key"}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-3 w-72 border-2 border-ink bg-card p-4 shadow-[6px_6px_0_0_var(--ink)]">
          <p className="mb-3 text-xs text-ink-soft">Optional. Adds a summary and plan of attack to any issue. The key stays in this browser and goes only to the provider you pick.</p>
          <select
            value={value.provider}
            onChange={(e) => set({ ...value, provider: e.target.value as Provider })}
            className="mb-2 w-full border-2 border-ink bg-bg px-2 py-1.5 text-sm"
          >
            {Object.entries(PROVIDERS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <input
            type="password"
            value={value.key}
            onChange={(e) => set({ ...value, key: e.target.value })}
            placeholder="API key"
            autoComplete="off"
            className="w-full border-2 border-ink bg-bg px-2 py-1.5 text-sm outline-none focus:border-go"
          />
        </div>
      )}
    </div>
  );
}
