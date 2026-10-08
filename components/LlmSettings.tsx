"use client";

import { useState } from "react";
import KeyNotes from "@/components/KeyNotes";
import { clearKeys, readKeys, writeKeys } from "@/lib/keystore";
import { PROVIDERS, type Provider } from "@/lib/llm";

export type LlmConfig = { provider: Provider; key: string; remember?: boolean };

const SETTINGS = "llm-config";
const KEY = "llm-config.key";
const HOSTS: Record<Provider, string> = { anthropic: "api.anthropic.com", openai: "api.openai.com" };

export function loadConfig(): LlmConfig {
  const config: LlmConfig = { provider: "anthropic", key: "", remember: false };
  try {
    const raw = localStorage.getItem(SETTINGS);
    if (raw) {
      const stored = JSON.parse(raw) as { provider?: Provider; key?: string };
      if (stored.provider) config.provider = stored.provider;
      if (stored.key) {
        sessionStorage.setItem(KEY, JSON.stringify({ key: stored.key }));
        localStorage.setItem(SETTINGS, JSON.stringify({ provider: config.provider }));
      }
    }
    const keys = readKeys<{ key: string }>(KEY, sessionStorage, localStorage);
    config.key = keys.value?.key ?? "";
    config.remember = keys.remember;
  } catch {
    // storage unavailable: fall back to defaults
  }
  return config;
}

export default function LlmSettings({ value, onChange }: { value: LlmConfig; onChange: (c: LlmConfig) => void }) {
  const [open, setOpen] = useState(false);
  function set(c: LlmConfig) {
    try {
      localStorage.setItem(SETTINGS, JSON.stringify({ provider: c.provider }));
      if (c.key) writeKeys(KEY, { key: c.key }, Boolean(c.remember), sessionStorage, localStorage);
      else clearKeys(KEY, sessionStorage, localStorage);
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
          <p className="mb-3 text-xs text-ink-soft">Optional. Adds a summary and plan of attack to any issue.</p>
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
          <div className="mt-3">
            <KeyNotes host={HOSTS[value.provider]} remember={Boolean(value.remember)} hasKey={Boolean(value.key)} onRemember={(remember) => set({ ...value, remember })} onClear={() => set({ ...value, key: "" })} />
          </div>
        </div>
      )}
    </div>
  );
}
