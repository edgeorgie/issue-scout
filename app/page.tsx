"use client";

import { useEffect, useState } from "react";
import LlmSettings, { loadConfig, type LlmConfig } from "@/components/LlmSettings";
import AnalyzeButton from "@/components/AnalyzeButton";

type Result = {
  issue: { number: number; title: string; url: string; labels: string[]; comments: number };
  repo: { name: string; stars: number; score: { total: number }; aiPolicy: string; hasContributing: boolean };
};

const POLICY_LABEL: Record<string, string> = {
  forbidden: "AI: not accepted",
  disclosure: "AI: disclose use",
  allowed: "AI: mentioned",
  unknown: "AI: no policy found",
};

export default function Home() {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llm, setLlm] = useState<LlmConfig>({ provider: "anthropic", key: "" });
  const [me, setMe] = useState<{ login: string | null; oauth: boolean }>({ login: null, oauth: false });
  useEffect(() => {
    Promise.resolve().then(() => setLlm(loadConfig()));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, []);
  const [data, setData] = useState<{ languages: string[]; results: Result[] } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`/api/scout?user=${encodeURIComponent(user.trim())}`);
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Request failed");
      else setData(body);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Issue Scout</h1>
      <p className="mt-2 text-neutral-500">
        Open, unassigned issues in healthy open source repos that match the languages you use.
      </p>
      {me.oauth && (
        <div className="mt-3 text-sm text-neutral-500">
          {me.login ? (
            <form action="/api/auth/logout" method="post" className="inline">
              Signed in as {me.login}. <button className="underline">Sign out</button>
            </form>
          ) : (
            <a href="/api/auth/login" className="underline">
              Sign in with GitHub for a higher API limit
            </a>
          )}
        </div>
      )}
      <LlmSettings value={llm} onChange={setLlm} />
      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="GitHub username"
          className="flex-1 rounded-md border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
        />
        <button
          disabled={loading || !user.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Scouting..." : "Scout"}
        </button>
      </form>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      {data && (
        <section className="mt-8">
          <p className="text-sm text-neutral-500">Languages: {data.languages.join(", ") || "none detected"}</p>
          <ul className="mt-4 space-y-3">
            {data.results.map((r) => (
              <li key={r.issue.url} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="flex items-start justify-between gap-4">
                  <a href={r.issue.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    {r.issue.title}
                  </a>
                  <span className="shrink-0 rounded bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-900">
                    {r.repo.score.total}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {r.repo.name} - {r.repo.stars} stars - {r.repo.hasContributing ? "CONTRIBUTING found" : "no CONTRIBUTING"} -{" "}
                  {POLICY_LABEL[r.repo.aiPolicy]}
                </p>
                <AnalyzeButton repo={r.repo.name} number={r.issue.number} config={llm} />
              </li>
            ))}
          </ul>
          {!data.results.length && <p className="mt-4 text-neutral-500">No matching issues found.</p>}
        </section>
      )}
    </main>
  );
}
