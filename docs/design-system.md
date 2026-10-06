# Design system

## Principles

- A scoreboard: the number leads, color carries meaning.
- Hard shadows and borders for a tactile, high-contrast look.

## Typography

| Role | Typeface |
|---|---|
| Display | Big Shoulders, uppercase |
| Text | Public Sans |
| Code | IBM Plex Mono |

Fonts are loaded with `next/font` and exposed as CSS variables in `app/layout.tsx`.

## Color tokens

Defined as CSS variables in `app/globals.css` and mapped into Tailwind's theme.

| Token | Value | Use |
|---|---|---|
| `bg` | `#f4f3ee` | Page background |
| `ink` | `#101418` | Text and hard borders |
| `navy` | `#0d2240` | Header |
| `go` | `#0aa66a` | Strong score, AI welcome |
| `warn` | `#f2a516` | Decent score, disclosure |
| `stop` | `#e5484d` | Risky score, AI not accepted |

## Motion

- Score dials fill on load.
- Result rows rise in with a stagger.
- Skeleton rows while loading.

All animation respects `prefers-reduced-motion`.

## Components

| Component | Purpose |
|---|---|
| Dial | Score ring with a color band |
| Policy chip | AI policy with an explanation on hover |
| AnalyzeButton | Optional plan of attack |

## Rules

- Color carries meaning; it is never the only signal.
- Interactive elements have visible focus and accessible names.
- New tokens are added to `globals.css` and this document together.
