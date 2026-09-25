# Is It DNS?

[![Is it still DNS?](https://github.com/YOUR-USERNAME/is-it-dns/actions/workflows/check.yml/badge.svg)](https://github.com/YOUR-USERNAME/is-it-dns/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-172033.svg)](LICENSE)
[![Confidence](https://img.shields.io/badge/confidence-100%25-D2362B.svg)](#)
[![Days since it was DNS](https://img.shields.io/badge/days%20since%20it%20was%20DNS-0-F5C518.svg)](#)

**A rigorous, peer-reviewed troubleshooting flowchart. Every path ends in DNS.**

[**Try it →**](https://YOUR-USERNAME.github.io/is-it-dns/)

![Is it DNS? A red stamp reads: It's DNS.](og.png)

## What it is

Is It DNS? is an interactive troubleshooting flowchart for engineers on call. Pick a symptom, answer a few questions, and it concludes that the cause is DNS.

It has 22 paths, and all 22 of them end in DNS. This isn't a bug. It's the finding.

Each ending names a real DNS failure and shows:

- **Evidence:** `dig` or `kubectl` output showing the problem
- **Root cause:** how it happened, which is usually a checklist item nobody reached
- **Fix:** what to do about it
- **A result you can copy** into the incident channel, with an emoji trail of your decisions

### Features

- 12 real failures, including stale A records, 86400-second TTLs, CNAMEs at the zone apex, SPF's 10-lookup limit, MX records pointing at CNAMEs, CoreDNS running out of memory, Kubernetes `ndots:5`, negative caching, and that `/etc/hosts` entry from 2019
- A plain-text reference section (a five-step "is it DNS?" check, plus every failure explained with RFC citations) that's useful after the laughing stops
- Keyboard shortcuts: press `1`–`9` to answer
- Light and dark mode, and works at phone width
- One HTML file with no build step, no framework and no dependencies. It has fewer moving parts than your resolver chain.

## Quick start

```sh
git clone https://github.com/YOUR-USERNAME/is-it-dns.git
cd is-it-dns
open index.html        # or xdg-open, or just double-click it
```

That's the whole setup.

## Deploy to GitHub Pages

1. Fork or create a public repo named `is-it-dns` and push these files to its root, including `.nojekyll` and `.github/`.
2. Fill in your details:
   ```sh
   ./configure.sh your-github-username "Your Name"
   ```
   This fills in your username and name in the page, metadata, sitemap, crawler files, license and docs. Run it once, then commit and push the result.
3. In the repo, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)`.
4. After a minute or two it's live at `https://your-github-username.github.io/is-it-dns/`.

If it doesn't load right away, give it a few minutes. You know why.

## Project layout

| Path | What it does |
| --- | --- |
| `index.html` | The whole app: markup, styles, flowchart data and logic |
| `404.html` | NXDOMAIN page for anything that doesn't exist |
| `og.png` | 1200×630 preview image for Slack, Discord and X |
| `favicon.svg`, `apple-touch-icon.png`, `site.webmanifest` | Icons and home-screen metadata |
| `robots.txt`, `sitemap.xml`, `llms.txt` | Instructions and summaries for search engines and AI crawlers |
| `scripts/check.mjs` | Checks that every path ends in DNS and every copy of the content agrees |
| `.github/workflows/check.yml` | Runs the check on every push and pull request |
| `configure.sh` | Fills in your username and name everywhere |
| `.nojekyll` | Tells GitHub Pages to serve files as they are |

## How it works

The flowchart data lives in two objects near the top of the `<script>` block in `index.html`:

- `N` holds the questions. Each option is `["Answer label", "nextId"]`.
- `V` holds the verdicts. Every ID starts with `V_`, and each verdict has a diagnosis, evidence, root cause and fix.

The page walks the tree from `start`, draws your path on the left, and stamps the verdict. The footer counts the paths on page load and reports how many end in DNS. The two numbers have always matched.

To check everything yourself:

```sh
node scripts/check.mjs
# ✓ 12 questions, 13 verdicts, 22 paths, 12 cause cards, 15 FAQ entries. All paths end in DNS.
```

## Search engines and AI assistants

The flowchart needs JavaScript, and most AI crawlers don't run it. So the page also ships about 1,200 words of plain HTML that anything can read:

- Question-style headings with direct answers of 40 to 60 words, written to be quoted in search snippets and AI answers
- JSON-LD structured data: `WebSite`, `WebPage` (with `speakable`), `WebApplication`, `Person`, `FAQPage` and `HowTo`
- A canonical URL, Open Graph and Twitter cards, a `sitemap.xml`, a `robots.txt` that welcomes named AI crawlers, and an `llms.txt` summary

After it goes live:

1. Add the site to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters), and submit `sitemap.xml` to both. Bing's index also feeds ChatGPT search and Copilot.
2. Check the markup with the [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/).
3. Run [PageSpeed Insights](https://pagespeed.web.dev/) to see Core Web Vitals.

Things to know:

- **Project sites and `robots.txt`.** Crawlers only read `robots.txt` from the domain root. At `username.github.io/is-it-dns/`, this repo's copy is ignored, although nothing blocks the page. For `robots.txt` and `llms.txt` to count, use a custom domain (add a `CNAME` file) or host the site from a repo named `username.github.io`. Setting up that custom domain will, of course, involve DNS.
- **Google rich results.** Google shows FAQ rich results only for well-known government and health sites, and no longer shows HowTo results. The markup still helps Bing and AI answer engines understand the page.

## Contributing

New ways for it to be DNS are very welcome, as long as they're real and every path still ends in DNS. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add one and how to run the check.

## FAQ

**What if it isn't DNS?**
It is. The flowchart has a branch for people who are sure it isn't, and that branch ends in DNS too.

**Is this a real troubleshooting tool?**
Partly. The conclusion is a joke, but the evidence isn't. Every ending is a real failure you'll meet on call, and the five-step check on the page is a sound first pass in a real incident.

**Can I use this in on-call training or an internal wiki?**
Yes. It's MIT-licensed. Fork it, rebrand it, or add your own company's favorite DNS disasters (with the details anonymized).

**Why is the "days since it was DNS" counter always 0?**
Accuracy.

## License

[MIT](LICENSE) © 2026 YOUR-NAME

No warranty is provided, express or implied, including any warranty that it's not DNS.
