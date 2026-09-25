# Contributing to Is It DNS?

Thanks for helping. Every contribution makes the flowchart more accurate and no less certain of its conclusion.

## The one rule

**Every path ends in DNS.** This isn't up for discussion, and PRs that add a non-DNS ending will be closed with a link to the flowchart. If you're sure your outage wasn't DNS, the flowchart has a branch for you.

## The other rules

1. **The DNS failure has to be real.** The joke is the conclusion. The evidence is serious. Each verdict should describe something that happens in production and that an on-call engineer would recognize.
2. **Cite a source when one exists.** An RFC section, vendor docs or a well-known postmortem. Link to the primary source, not a blog post summarizing it.
3. **Use documentation-safe values.** Use `example.com`, `example.net` and `example.org` for domains, and `192.0.2.0/24`, `198.51.100.0/24` or `203.0.113.0/24` for IPs ([RFC 5737](https://www.rfc-editor.org/rfc/rfc5737), [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606)). No real company domains, and nothing from your employer's actual incident.
4. **Punch at DNS, not people.** Jokes about TTLs, caches and the person who set `ndots:5` are welcome. Jokes about a named person, team or vendor are not.
5. **No build step, no dependencies.** The site is one HTML file. Please keep it that way.

## Ways to help

- **Add a new way it's DNS.** The most wanted contribution. See below.
- **Fix something wrong.** A command with the wrong flag, an RFC section that moved, a claim that's out of date.
- **Improve the copy.** Shorter and clearer beats longer and cleverer.
- **Report a bug.** Open an issue with your browser, what you clicked and what happened. If the bug is that it wasn't DNS, see the one rule.

## Adding a new way it's DNS

The content lives in four places, because humans, browsers, search engines and AI assistants each read a different copy. The check script tells you if they drift apart.

### 1. The flowchart (`index.html`, the `<script>` block)

Add a verdict to `V`:

```js
V_dnssec:{tag:"expired DNSSEC signature",
  c:"The zone's RRSIG expired at 00:00 UTC, so validating resolvers now return SERVFAIL.",
  dig:`$ dig example.com +dnssec
<c>;; ->>HEADER<<- opcode: QUERY, </c><h>status: SERVFAIL</h>`,
  why:"Re-signing ran on a cron job on a server that was retired in March.",
  fix:"Re-sign the zone, then move signing to your DNS provider or an automated signer."},
```

| Field | What it is |
| --- | --- |
| `tag` | Short name of the failure, shown in the copied result |
| `c` | One-sentence diagnosis, shown large under the stamp |
| `dig` | Terminal output as evidence. Wrap highlights in `<h>…</h>` and comments in `<c>…</c>` |
| `why` | Root cause, in one or two sentences |
| `fix` | What to do about it |

Then point an answer at it from a question in `N`. Each option is `["Answer label", "nextId"]`. You can also add a new question:

```js
sig1:{q:"Does it fail only on resolvers that validate DNSSEC?",o:[["Yes","V_dnssec"],["No idea what that means","V_dnssec"]]},
```

Keep questions answerable in under five seconds by someone who's been paged at 3am.

### 2. The visible cards (`index.html`, the `#causes` section)

Add an `<article class="cause">` with a `<span class="tag">`, an `<h3>` phrased as the question someone would search for, a `<p>` answer of about 40 to 60 words, and a source link if there is one. Copy an existing card.

### 3. Structured data (`index.html`, the `application/ld+json` block)

Add a matching `Question` to the `FAQPage` `mainEntity` list. The `name` must match the card's `<h3>` exactly and the `text` must match its answer, with HTML tags removed.

### 4. `llms.txt`

Add the same question and answer under "12 ways it's DNS".

### 5. Update the counts

If the number of paths or cards changed, update "22 paths" and "12 ways it's DNS" wherever they appear. The check script lists every place that's wrong.

## Check your work

```sh
node scripts/check.mjs
```

It confirms that:

- every answer leads to a question or verdict that exists
- every path ends in a verdict, and nothing loops
- every question and verdict can be reached
- every verdict has all its fields
- the structured data parses, and its FAQ matches the visible questions and `llms.txt`
- the path and card counts in the copy are correct

It runs on every pull request, so you'll find out either way. Also open `index.html` in a browser and click through your new path, in light and dark mode and at phone width.

## Pull requests

- One new failure (or one fix) per PR.
- Title it like a postmortem: `Add verdict: expired DNSSEC signature`.
- In the description, say where you've seen this happen (in general terms) and link your source.
- Update `dateModified` and the visible "Updated" date in `index.html`, and `<lastmod>` in `sitemap.xml`.

## Code of conduct

Be kind. Everyone here has been paged for something that turned out to be DNS, and nobody enjoyed it. Harassment of any kind gets you removed from the project, which, like a bad record, will be cached for a very long time.
