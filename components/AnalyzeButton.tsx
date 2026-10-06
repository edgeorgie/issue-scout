"use client";

import { useState } from "react";
import { analyze, buildPrompt } from "@/lib/llm";
import type { LlmConfig } from "./LlmSettings";

export default function AnalyzeButton({ repo, number, config }: { repo: string; number: number; config: LlmConfig }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [text, setText] = useState("");

  async function run() {
    setState("loading");
    try {
      const r = await fetch(`/api/issue?repo=${encodeURIComponent(repo)}&number=${number}`);
      if (!r.ok) throw new Error("issue");
      const issue = (await r.json()) as { title: string; body: string };
      setText(await analyze(config.provider, config.key, buildPrompt(repo, issue.title, issue.body)));
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (!config.key) return null;
  return (
    <div className="mt-4">
      {state !== "done" && (
        <button
          onClick={run}
          disabled={state === "loading"}
          className="rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white transition hover:bg-go active:scale-95 disabled:opacity-60"
        >
          {state === "loading" ? "Reading the issue..." : "Plan of attack"}
        </button>
      )}
      {state === "error" && <span className="ml-3 text-sm font-semibold text-stop">Failed. Check your key.</span>}
      {state === "done" && (
        <div className="row-in border-l-4 border-go bg-bg p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-soft">Plan of attack</p>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-[14px] leading-relaxed">{text}</pre>
        </div>
      )}
    </div>
  );
}
