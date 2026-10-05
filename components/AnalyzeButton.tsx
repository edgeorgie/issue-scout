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
    <div className="mt-2">
      {state !== "done" && (
        <button onClick={run} disabled={state === "loading"} className="text-sm underline disabled:opacity-50">
          {state === "loading" ? "Analyzing..." : "Analyze with AI"}
        </button>
      )}
      {state === "error" && <span className="ml-2 text-sm text-red-600">Failed. Check your key.</span>}
      {state === "done" && <pre className="mt-2 whitespace-pre-wrap text-sm">{text}</pre>}
    </div>
  );
}
