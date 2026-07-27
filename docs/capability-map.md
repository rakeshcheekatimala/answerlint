# AnswerLint capability map

This document keeps product explanations aligned with behavior shipped by the
CLI. Marketing pages and diagrams should not imply automatic rewriting,
guaranteed citations, or implemented model probing.

| Product promise | Status | Current command or behavior |
|---|---|---|
| Add a live page | Supported | `answerlint audit --url <url>` |
| Add Markdown or HTML | Supported | `answerlint audit --file <path>` |
| Review a content folder | Supported | `answerlint audit --dir <path>` |
| Review a sitemap | Supported | `answerlint audit --sitemap <url>` |
| Inspect clarity and trust | Supported | 12 deterministic AEO/GEO audits |
| See evidence | Supported | Audit result evidence in terminal and reports |
| See prioritized improvements | Supported | Recommendation priority and score impact |
| Get example markup | Supported where applicable | Recommendation code snippets |
| Edit and refresh while writing | Supported for Markdown/MDX | `answerlint tui --watch <file>` |
| Compare with another page | Supported for URLs | `audit --url <url> --compare <url>` |
| Compare before and after | Supported for JSON reports | `answerlint diff` |
| Prevent CI regressions | Supported | Audit thresholds and diff gates |
| Generate and lint `llms.txt` | Supported | `answerlint llms generate` and `llms lint` |
| Automatically rewrite content | Not supported | Users retain editorial control |
| Edit inside the TUI | Not supported | Edit in the user's normal editor |
| Browser-render client-side apps | Not supported | Audit rendered HTML or exported content |
| Guaranteed ranking or citation | Not claimed | Scores are prioritization signals |
| LLM probe workflow | Not implemented | Reserved CLI option only |

## Visual explanation rule

Use this sequence consistently:

```text
Add content → Inspect clarity and trust → Fix what matters → Edit and recheck
```

The primary outcome language is **clearer answers**, **stronger trust signals**,
and **better citation readiness**. AEO, GEO, and composite scores are supporting
diagnostics, not the headline promise.
