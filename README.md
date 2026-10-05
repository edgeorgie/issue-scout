# Issue Scout

Find open source issues you can actually fix. Given a GitHub username, Issue Scout detects the languages you use and lists open, unassigned issues from active repositories, ranked by a deterministic repo health score and flagged with the repo's AI contribution policy.

## How it works

- Languages: top 3 from the user's non-fork public repos.
- Issues: GitHub search for open, unassigned, "good first issue" issues with no linked PR.
- Health score (0-100): recent activity (30), response speed to external PRs (35), CONTRIBUTING present (15), no linked PR (20).
- AI policy: heuristic read of CONTRIBUTING.md and AGENTS.md (forbidden, disclosure, mentioned, unknown).
- Optional AI analysis (summary, difficulty, plan) with your own Anthropic or OpenAI key. The key lives in your browser and is sent only to the provider.
- Basic per-IP rate limiting and graceful handling of GitHub API limits.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Without any token the GitHub API allows 60 requests per hour. Set `GITHUB_TOKEN`, or configure a GitHub OAuth App (callback `<origin>/api/auth/callback`) to raise the limit to 5,000 per hour.

## Deploy

Deploy to Vercel and set the variables from `.env.example`.

## Scripts

`npm run dev`, `npm run build`, `npm run lint`, `npm test`.
