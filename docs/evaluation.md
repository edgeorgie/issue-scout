# Evaluation

A self-assessment against a reviewer's rubric. It states gaps plainly so a reviewer, a person or an agent, can verify or challenge each line.

| Criterion | Status | Notes |
|---|---|---|
| Onboarding | Pass | README has a one-command run, usage steps and configuration. |
| Reproducible build | Pass | Lockfile, Node 22 engine field, and one gate: `npm run verify`. |
| Automated tests | Partial | Unit tests cover the pure logic (2 of 7 requirements have tests). No browser end-to-end tests; UI behavior was verified manually and recorded in the traceability matrix. |
| Continuous integration | Gap | A workflow runs `npm run verify` but is not active until the repository token has the workflow permission. The gate runs locally. |
| Specification and traceability | Pass | Spec, plan, tasks, ADRs and a matrix enforced by `npm run spec:check`. |
| Documentation structure | Pass | Index, architecture with diagrams, glossary and design system. |
| Agent readiness | Pass | AGENTS.md, llms.txt, machine-readable requirements and a deterministic gate. There is no MCP server or OpenAPI document because the app is client-side. |
| LLM integration safety | Partial | Issue text is delimited as untrusted data in the prompt, but it remains untrusted input to the model for the optional analysis (indirect prompt injection is possible). The model has no tools and its reply is shown as plain text. |
| Privacy and data flow | Pass | Every data path and its storage is tabulated in the README. |
| Accessibility | Partial | Score dials have text labels; colors are paired with words, not used alone. Not audited with automated tooling. |
| Performance | Partial | Each scout makes several GitHub requests and can take a few seconds. Not measured with Lighthouse. |
| Security | Partial | Rate limiting is per instance (keyed by the platform IP, bounded, with a global cap and result cache); `/api/issue` reads only public repositories with the server token; OAuth round trip is not verified end to end. Baseline security headers are set (nosniff, frame denial, referrer and permissions policies). No Content Security Policy is configured. |
| Deployment | Pass | Live on Vercel at https://issue-scout-seven.vercel.app. The main flow was exercised with real GitHub data and invalid input returns 400. Security headers are applied by the host. |
| Licensing | Pass | MIT. |

## Verify it yourself

```bash
npm install
npm run verify
```

Requirements marked "Implemented, not verified end to end" in [spec.md](spec/spec.md) depend on a real external service or credential that was not exercised.
