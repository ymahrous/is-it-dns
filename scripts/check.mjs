// Checks that the flowchart is sound and every copy of the content agrees.
// Usage: node scripts/check.mjs   (no dependencies)
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const llms = readFileSync(new URL("../llms.txt", import.meta.url), "utf8");
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

// 4. Structured data parses, and its FAQ matches the questions people can see.
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
let graph = [];
try { graph = JSON.parse(ld[1])["@graph"]; } catch (e) { fail(`JSON-LD doesn't parse: ${e.message}`); }
const faq = graph.find((g) => g["@type"] === "FAQPage");
const markup = html.replace(/<script[\s\S]*?<\/script>/g, "");
const visibleQs = [...markup.matchAll(/<h3>(.*?)<\/h3>/g)].map((m) => decode(m[1]));
const ldQs = (faq?.mainEntity ?? []).map((q) => q.name);
for (const q of ldQs) {
  if (!visibleQs.includes(q)) fail(`JSON-LD question isn't on the page: "${q}"`);
  if (!llms.includes(q)) fail(`llms.txt is missing the question: "${q}"`);
}
for (const q of visibleQs) if (!ldQs.includes(q)) fail(`Visible question missing from JSON-LD: "${q}"`);

// 5. The counts in the copy match reality.
const causes = (markup.match(/<article class="cause"/g) ?? []).length;
for (const [label, n, re] of [
  ["paths", paths, /(\d+) paths/g],
  ["ways it's DNS", causes, /(\d+) ways it's DNS/g],
]) {
  for (const src of [["index.html", html], ["llms.txt", llms]])
    for (const m of src[1].matchAll(re))
      if (+m[1] !== n) fail(`${src[0]} says "${m[0]}" but there are ${n} ${label}.`);
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${Object.keys(N).length} questions, ${Object.keys(V).length} verdicts, ${paths} paths, ${causes} cause cards, ${ldQs.length} FAQ entries. All paths end in DNS.`);
