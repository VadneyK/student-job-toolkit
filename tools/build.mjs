// Copies the prompts in prompts/*.md into kit-page/index.html, so the one HTML file carries them offline.
// Each prompt file: "# Title", a "When: ..." line, and the prompt in the first ```text block.
// Usage: node tools/build.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "prompts");
const prompts = readdirSync(dir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort().map((f) => {
  const md = readFileSync(join(dir, f), "utf8");
  const title = (md.match(/^# (.+)$/m) || [])[1];
  const when = ((md.match(/^When: (.+)$/m) || [])[1] || "").trim();
  const text = (md.match(/```text\n([\s\S]*?)\n```/) || [])[1];
  if (!title || !text) throw new Error(f + ": needs a '# Title' line and a ```text block");
  return { id: f.replace(/\.md$/, ""), title, when, text };
});
const page = join(root, "kit-page", "index.html");
const html = readFileSync(page, "utf8");
const json = JSON.stringify(prompts).replace(/</g, "\\u003c");
const re = /(<script id="prompt-data" type="application\/json">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error("kit-page/index.html has no prompt-data block");
writeFileSync(page, html.replace(re, (_, a, b) => a + json + b));
console.log("built " + prompts.length + " prompts into kit-page/index.html");
