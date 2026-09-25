// Checks that the flowchart is sound and every copy of the content agrees.
// Usage: node scripts/check.mjs   (no dependencies)
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const llms = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const errors = [];
const fail = (msg) => errors.push(msg);
const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
  .replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();

// 1. Load the flowchart data (N = questions, V = verdicts) from the page script.
const start = html.indexOf("const N = {");
const end = html.indexOf("// Count paths");
if (start < 0 || end < 0) {
  console.error("Could not find `const N` and `// Count paths` in index.html.");
  process.exit(1);
}
const { N, V } = new Function(html.slice(start, end) + "; return { N, V };")();

// 2. Every option leads somewhere, every path ends in a verdict, and nothing loops.
let paths = 0;
const reached = new Set();
function walk(id, trail) {
  if (trail.includes(id)) return fail(`Loop: ${[...trail, id].join(" → ")}`);
  reached.add(id);
  if (V[id]) { paths++; return; }
  if (!N[id]) return fail(`"${trail.at(-1)}" points to "${id}", which doesn't exist.`);
  if (!N[id].o?.length) return fail(`Question "${id}" has no options.`);
  for (const [label, next] of N[id].o) {
    if (!label?.trim()) fail(`Question "${id}" has an option with no label.`);
    walk(next, [...trail, id]);
  }
}
walk("start", []);
for (const id of [...Object.keys(N), ...Object.keys(V)])
  if (!reached.has(id)) fail(`"${id}" can't be reached from "start".`);

// 3. Verdicts have every field, and IDs follow the V_ convention.
for (const [id, v] of Object.entries(V)) {
  if (!id.startsWith("V_")) fail(`Verdict "${id}" should start with V_.`);
  for (const k of ["tag", "c", "dig", "why", "fix"])
    if (!v[k]?.trim()) fail(`Verdict "${id}" is missing "${k}".`);
}

// 4. Evidence uses documentation-safe values only (RFC 5737, RFC 1918, RFC 2606),
//    plus the handful of real resolvers and infrastructure names the examples need.
const okIP = (ip) => {
  const [a, b, c] = ip.split(".").map(Number);
  return (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) || a === 10 || a === 127 ||
    (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
    ["1.1.1.1", "8.8.8.8"].includes(ip);
};
const okHosts = ["gtld-servers.net", "coredns.io"];
for (const [id, v] of Object.entries(V)) {
  const text = Object.values(v).join("\n");
  for (const [ip] of text.matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b(?!\.in-addr)/g))
    if (!okIP(ip)) fail(`Verdict "${id}" uses ${ip}, which isn't a documentation or private address.`);
  for (const [host] of text.matchAll(/\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|app)\b/gi))
    if (!/(^|\.)example\.(com|net|org)$/i.test(host) && !okHosts.some((h) => host === h || host.endsWith("." + h)))
      fail(`Verdict "${id}" names ${host}. Use example.com, example.net or example.org.`);
}

// 5. Every verdict that links a cause card links one that exists, every card is used,
//    and every card cites a source.
const markup = html.replace(/<script[\s\S]*?<\/script>/g, "");
const cards = [...markup.matchAll(/<article class="cause" id="([^"]+)">([\s\S]*?)<\/article>/g)]
  .map(([, id, body]) => ({ id, q: decode(body.match(/<h3>(.*?)<\/h3>/)?.[1] ?? ""),
    a: decode(body.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? ""), src: /class="src" href="https:\/\//.test(body) }));
const cardIds = new Set(cards.map((c) => c.id));
for (const [id, v] of Object.entries(V))
  if (v.card && !cardIds.has(v.card)) fail(`Verdict "${id}" links card "${v.card}", which doesn't exist.`);
for (const c of cards) {
  if (!Object.values(V).some((v) => v.card === c.id)) fail(`Card "${c.id}" isn't linked from any verdict.`);
  if (!c.src) fail(`Card "${c.id}" has no source link.`);
}

// 6. Structured data parses, and its FAQ matches the questions people can see.
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
let graph = [];
try { graph = JSON.parse(ld[1])["@graph"]; } catch (e) { fail(`JSON-LD doesn't parse: ${e.message}`); }
const faq = graph.find((g) => g["@type"] === "FAQPage");
const visibleQs = [...markup.matchAll(/<h3>(.*?)<\/h3>/g)].map((m) => decode(m[1]));
const ldQs = (faq?.mainEntity ?? []).map((q) => q.name);
for (const q of ldQs) {
  if (!visibleQs.includes(q)) fail(`JSON-LD question isn't on the page: "${q}"`);
  if (!llms.includes(q)) fail(`llms.txt is missing the question: "${q}"`);
}
for (const q of visibleQs) if (!ldQs.includes(q)) fail(`Visible question missing from JSON-LD: "${q}"`);

// 7. Answers match word for word: visible text, JSON-LD and llms.txt.
const visibleAs = new Map([
  ...cards.map((c) => [c.q, c.a]),
  ...[...markup.matchAll(/<div class="faq-item"><h3>(.*?)<\/h3><p class="faq-a">([\s\S]*?)<\/p>/g)].map((m) => [decode(m[1]), decode(m[2])]),
]);
for (const q of faq?.mainEntity ?? []) {
  const a = visibleAs.get(q.name);
  if (a !== undefined && a !== q.acceptedAnswer?.text) fail(`JSON-LD answer differs from the page: "${q.name}"`);
  if (a !== undefined && !llms.includes(a)) fail(`llms.txt answer differs from the page: "${q.name}"`);
}
const howto = graph.find((g) => g["@type"] === "HowTo");
const steps = [...markup.matchAll(/<li><div><b>(.*?)<\/b>([\s\S]*?)<\/div><\/li>/g)].map((m) => [decode(m[1]), decode(m[2])]);
if ((howto?.step ?? []).length !== steps.length) fail(`JSON-LD HowTo has ${howto?.step?.length ?? 0} steps, the page has ${steps.length}.`);
steps.forEach(([name, text], i) => {
  const st = howto?.step?.[i];
  if (st && (st.name !== name || st.text !== text)) fail(`JSON-LD HowTo step ${i + 1} differs from the page.`);
  if (!llms.includes(`**${name}.** ${text}`)) fail(`llms.txt step ${i + 1} differs from the page.`);
});

// 8. The counts in the copy match reality.
const causes = cards.length;
for (const [label, n, re] of [
  ["paths", paths, /(\d+) paths/g],
  ["ways it's DNS", causes, /(\d+) ways it's DNS/g],
  ["cause cards", causes, /(\d+) real (?:DNS )?failures/g],
]) {
  for (const src of [["index.html", html], ["llms.txt", llms], ["README.md", readme]])
    for (const m of src[1].matchAll(re))
      if (+m[1] !== n) fail(`${src[0]} says "${m[0]}" but there are ${n} ${label}.`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${Object.keys(N).length} questions, ${Object.keys(V).length} verdicts, ${paths} paths, ${causes} cause cards, ${ldQs.length} FAQ entries. All paths end in DNS.`);
