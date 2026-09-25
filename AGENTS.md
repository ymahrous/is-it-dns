# AGENTS.md

Guidance for coding agents working in this repository.

## What this is

A static, single-page joke troubleshooting flowchart (GitHub Pages) where every path ends in DNS. The conclusion is the joke; everything else is meant to be a working root cause analysis. Each question is a real diagnostic step, and each ending describes a real DNS failure with output in the real format, a root cause, a fix and a primary source.

No build step, no framework, no dependencies. Keep it that way.

## Commands

```sh
node scripts/check.mjs   # the only test; CI runs it on every push/PR (.github/workflows/check.yml, Node 20)
open index.html          # run the site; click through changed paths in light/dark mode and at phone width
```

## Architecture

Everything lives in `index.html`: markup, CSS, JSON-LD, and the flowchart data and logic in the final `<script>` block.

- `N` holds questions: `id:{q, hint?, o:[["Answer label","nextId"], ...]}`. The walk starts at `start`. Questions can be shared by several branches (for example `srv1`, the `dig +cd` DNSSEC split, is reached from both the website and TLS branches).
- `V` holds verdicts: IDs start with `V_`, with `tag`, `c` (diagnosis), `dig` (evidence), `why` (root cause), `fix`, and `card`, the `id` of the matching cause card. The verdict panel reads that card's `.src` link at runtime and shows it, so a source is stored once. `V_denial` is the only verdict with no card.
- In `dig`, `<h>…</h>` highlights and `<c>…</c>` marks comments; everything else is HTML-escaped by `termFmt`, so write `<none>` literally.
- `scripts/check.mjs` extracts `N` and `V` by evaluating the source text between `const N = {` and the `// Count paths` comment. Don't rename those anchors or put anything between them that won't evaluate standalone.

### The same content exists in four places

Humans, browsers, search engines and AI crawlers each read a different copy, and they must match word for word:

1. The `<article class="cause">` cards in `#causes`: `id`, tag, `<h3>` phrased as a search question, a 40–60 word `<p>` answer, and an `<a class="src">` source.
2. The `FAQPage` in the `application/ld+json` block: one `Question` per card plus the general FAQ items, with the answer text equal to the visible `<p>` with tags removed.
3. `llms.txt`: the same questions, answers and sources, plus the five-step check.
4. The five-step "How do I check if it's DNS?" list, which also appears as the JSON-LD `HowTo` steps.

`check.mjs` enforces all of that, plus:

- every path ends in a verdict with no loops, and everything is reachable
- verdict `card` links resolve, every card is linked from a verdict and has a source
- evidence uses only RFC 5737, RFC 1918 or loopback IPs (plus `1.1.1.1` and `8.8.8.8`) and `example.com/.net/.org` names. `gtld-servers.net` and `coredns.io` are allowlisted because the real output contains them
- the "N paths", "N ways it's DNS" and "N real (DNS) failures" counts in `index.html`, `llms.txt` and `README.md` are correct

It does not check the README's feature list or the `✓ …` sample output line. Update those by hand.

## Content rules (see CONTRIBUTING.md)

- Every path ends in DNS. Never add a non-DNS ending.
- Evidence must match real tool output. Run the command, or check the tool's docs, before writing its output. Don't invent lines the tool never prints.
- Cite primary sources (RFC section, vendor docs, man page) and check the section number.
- Use documentation-safe values only: `example.com/.net/.org` and IPs from `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`.
- Aim jokes at DNS, never at named people, teams or vendors.
- Questions should be answerable with one command in under five seconds by someone paged at 3am.
- When content changes, update `dateModified`, `article:modified_time` and the visible "Updated" `<time>` in `index.html`, plus `<lastmod>` in `sitemap.xml`.
