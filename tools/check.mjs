// Checks every text file in the kit before a commit: no em or en dashes, no email addresses or
// phone numbers, and no "[PASTE ...]" slot missing from a prompt that needs one.
// Usage: node tools/check.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { if (f === ".git" || f === "node_modules" || f === "screenshots") continue; const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(md|html|mjs|js|json|txt)$/.test(f) && files.push(p); } })(root);
const DASHES = new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]");
const problems = [];
for (const p of files) {
  const s = readFileSync(p, "utf8");
  const rel = relative(root, p);
  s.split("\n").forEach((line, i) => {
    if (DASHES.test(line)) problems.push(rel + ":" + (i + 1) + " has an em or en dash");
    const emails = line.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
    for (const e of emails) if (!/noreply|example(\.(com|org))?$/i.test(e)) problems.push(rel + ":" + (i + 1) + " has an email address: " + e);
    if (/\(?\b\d{3}\)?[ .-]\d{3}[ .-]\d{4}\b/.test(line)) problems.push(rel + ":" + (i + 1) + " looks like a phone number");
  });
}
for (const f of readdirSync(join(root, "prompts")).filter((f) => /^0[1-7]/.test(f))) {
  const s = readFileSync(join(root, "prompts", f), "utf8");
  if (!s.includes("[PASTE YOUR PROFILE CARD HERE]")) problems.push("prompts/" + f + " has no profile card slot");
}
if (problems.length) { console.log(problems.join("\n")); process.exit(1); }
console.log("check: " + files.length + " files clean (no dashes, emails, or phone numbers)");
