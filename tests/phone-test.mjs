// Phone-width test of kit-page/index.html in headless Chrome, driven over the DevTools protocol.
// Opens the page from file:// at 375x812 (an iPhone-size screen), walks every tab as a student would,
// checks there is no sideways scroll, that saved data survives a reload, that the leads file carries no notes,
// and saves a screenshot of each tab to tests/screenshots/.
// Usage: node --experimental-websocket tests/phone-test.mjs   (Node 20; Node 22 needs no flag)
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const url = pathToFileURL(join(root, "kit-page", "index.html")).href;
const shots = join(root, "tests", "screenshots");
mkdirSync(shots, { recursive: true });
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
// Any Chromium works: $CHROME, Google Chrome, or a Playwright headless shell.
function findChrome() {
  const pw = join(homedir(), "Library", "Caches", "ms-playwright");
  const shells = existsSync(pw) ? readdirSync(pw).filter((d) => d.startsWith("chromium_headless_shell")).map((d) => join(pw, d, "chrome-headless-shell-mac-arm64", "chrome-headless-shell")) : [];
  return [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", ...shells].find((c) => c && existsSync(c));
}
const chrome = findChrome();
if (!chrome) { console.log("No Chrome or Chromium found. Set CHROME=/path/to/chrome."); process.exit(2); }
const profile = mkdtempSync(join(tmpdir(), "sjt-chrome-"));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, [...(/headless-shell/.test(chrome) ? [] : ["--headless=new"]), "--remote-debugging-port=" + port, "--user-data-dir=" + profile, "--no-first-run", "--allow-file-access-from-files", "about:blank"], { stdio: "ignore" });

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log((ok ? "PASS " : "FAIL ") + name + (detail ? "  (" + detail + ")" : "")); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() { for (let i = 0; i < 50; i++) { try { return await (await fetch("http://127.0.0.1:" + port + "/json")).json(); } catch { await wait(200); } } throw new Error("Chrome did not start"); }
let ws, seq = 0; const pending = new Map();
function send(method, params = {}) { const id = ++seq; ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => pending.set(id, { res, rej })); }
async function evalJS(expr) { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception && r.exceptionDetails.exception.description)); return r.result.value; }
async function load() { await send("Page.navigate", { url }); await wait(700); }
async function shot(name) { const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true }); writeFileSync(join(shots, name + ".png"), Buffer.from(r.data, "base64")); }
const noSideScroll = () => evalJS("document.documentElement.scrollWidth <= window.innerWidth");
const tab = (k) => evalJS(`document.getElementById("tab-${k}").click(); true`);

try {
  const page = (await targets()).find((t) => t.type === "page");
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  ws.addEventListener("message", (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await load();

  const nPrompts = readdirSync(join(root, "prompts")).filter((f) => /^\d\d-.*\.md$/.test(f)).length;
  check("page loads with all " + nPrompts + " prompts built in", await evalJS(`JSON.parse(document.getElementById("prompt-data").textContent).length`) === nPrompts);
  check("storage works from file://", !/Not saving/.test(await evalJS(`document.getElementById("save").textContent`)));
  check("Opens on the Experience tab", await evalJS(`!document.getElementById("v-log").hidden`));
  check("Experience: no sideways scroll at 375px", await noSideScroll()); await shot("1-experience-empty");

  await evalJS(`(() => { const f = document.getElementById("exp-form"); f.elements.what.value = "Fall retreat registration desk"; f.elements.role.value = "Desk lead"; f.elements.group.value = "campus ministry"; f.elements.start.value = "2025-09"; f.elements.end.value = "2025-10"; f.elements.hours.value = "20"; f.elements.did.value = "Led a team of 6 volunteers at check-in\\nhelped with the cleanup\\nBuilt the sign-up sheet in Google Sheets"; f.elements.reach.value = "180 students checked in over 2 days"; f.elements.estimate.checked = true; f.elements.skills.value = "event planning, Google Sheets, leading volunteers"; f.elements.adult.value = "Alex"; f.elements.adultRole.value = "campus staff"; document.getElementById("save-exp").click(); return true; })()`);
  await evalJS(`(() => { const f = document.getElementById("exp-form"); f.elements.what.value = "Math tutoring"; f.elements.role.value = "Tutor"; f.elements.group.value = "church youth group"; f.elements.start.value = "2024-01"; f.elements.hours.value = "2 a week"; f.elements.did.value = "Tutoring 3 middle schoolers in algebra"; f.elements.skills.value = "teaching, google sheets"; document.getElementById("save-exp").click(); return true; })()`);
  check("Experience: two entries saved", await evalJS(`document.querySelectorAll("#exp-list .row").length`) === 2);
  await shot("1b-experience");
  await tab("resume");
  const res = await evalJS(`document.getElementById("resume-list").innerText`);
  check("Resume: header line has role, group, dates and hours", /Desk lead: Fall retreat registration desk, campus ministry, Sep 2025 to Oct 2025 \(about 20 hours\)/.test(res));
  check("Resume: estimate becomes About", /About 180 students checked in over 2 days\./.test(res));
  check("Resume: weak verb flagged", /starts with "helped"/.test(res));
  check("Resume: -ing verb flagged", /starts with "tutoring"/.test(res));
  check("Resume: ongoing entry reads 'to now'", /Tutor: Math tutoring, church youth group, Jan 2024 to now \(2 hours a week\)/.test(res));
  check("Resume: unconfirmed adult gets a confirm message button", await evalJS(`!!document.querySelector("[id^=confirm-]")`));
  const skillsText = await evalJS(`document.getElementById("skills-list").innerText`);
  check("Resume: skills merged, counted, each with an example", /Google Sheets \(shown in 2 entries\)/.test(skillsText) && /Example: Built the sign-up sheet in Google Sheets \(Fall retreat registration desk\)/.test(skillsText));
  check("Resume: no sideways scroll", await noSideScroll()); await shot("1c-resume-lines");
  await tab("card");
  check("Card: starts with the blank card", /MY PROFILE CARD/.test(await evalJS(`document.getElementById("card").value`)));
  await evalJS(`const c=document.getElementById("card"); c.value = c.value.replace("Name (first name is enough):", "Name (first name is enough): Sam").replace("Target roles (up to 3, from prompt 1):", "Target roles (up to 3, from prompt 1): data analyst, operations analyst"); c.dispatchEvent(new Event("input")); true`);
  check("Card: no sideways scroll", await noSideScroll()); await shot("2-card");

  await tab("prompts");
  check("Prompts: one card per prompt", await evalJS(`document.querySelectorAll("#prompt-list .row").length`) === nPrompts - 1);
  const filled = await evalJS(`document.getElementById("copy-02-match-test").click(); new Promise(r => setTimeout(() => r(document.querySelector("#prompt-list .row:nth-child(2) > pre").textContent), 300))`);
  check("Prompts: Copy pastes the card into the match test", /Name \(first name is enough\): Sam/.test(filled) && !/\[PASTE YOUR PROFILE CARD HERE\]/.test(filled) && /\[PASTE THE JOB POST HERE\]/.test(filled));
  check("Prompts: no sideways scroll", await noSideScroll()); await shot("3-prompts");

  await tab("jobs");
  await evalJS(`(() => { const f = document.getElementById("form"); f.elements.company.value = "Example Co"; f.elements.role.value = "Junior Data Analyst"; f.elements.link.value = "https://example.com/jobs/1"; f.elements.stage.value = "Applied"; f.elements.verdict.value = "Apply"; f.elements.next.value = "Follow up if no reply"; f.elements.due.value = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10); f.elements.notes.value = "PRIVATE NOTE: talked to a friend there"; f.elements.share.checked = true; document.getElementById("save-job").click(); return true; })()`);
  await evalJS(`(() => { const f = document.getElementById("form"); f.elements.company.value = "Sample Labs"; f.elements.role.value = "Operations Intern"; f.elements.stage.value = "Saved"; f.elements.verdict.value = "Ask first"; f.elements.next.value = "Send questions-first reply"; document.getElementById("save-job").click(); return true; })()`);
  check("Jobs: two jobs saved", await evalJS(`document.querySelectorAll("#job-list .row").length`) === 2);
  check("Jobs: no sideways scroll", await noSideScroll()); await shot("4-jobs");

  await tab("jobs");
  check("Today: the due job shows with Done, Snooze, Not for me", await evalJS(`document.querySelectorAll("#today-list .row.due").length === 1 && !!document.querySelector("#today-list [id^=done-]") && !!document.querySelector("#today-list [id^=snooze-]") && !!document.querySelector("#today-list [id^=close-]")`));
  check("Jobs: counts 1 application this week", /^1$/.test(await evalJS(`document.querySelector("#stats .stat b").textContent`)));
  await shot("5-jobs-due");
  await evalJS(`document.querySelector("#today-list [id^=snooze-]").click(); true`);
  check("Today: Snooze moves it off today", await evalJS(`document.querySelectorAll("#today-list .row.due").length`) === 0);

  await load();
  check("Reload: log, jobs and card survive", await evalJS(`(() => { const s = JSON.parse(localStorage.getItem("student-job-toolkit-v1")); return s.jobs.length === 2 && s.exp.length === 2 && /Sam/.test(s.card); })()`));

  await tab("backup");
  await evalJS(`window.__blobs = []; const o = URL.createObjectURL; URL.createObjectURL = (b) => { window.__blobs.push(b); return o(b); }; true`);
  await evalJS(`document.getElementById("export-leads").click(); true`);
  const leads = await evalJS(`window.__blobs[0].text()`);
  check("Leads file: has the shared job and no notes", /Example Co/.test(leads) && !/PRIVATE NOTE/.test(leads) && !/Sample Labs/.test(leads) && !/Sam/.test(leads));
  await evalJS(`document.getElementById("export").click(); true`);
  const backup = await evalJS(`window.__blobs[1].text()`);
  check("Backup file: has both jobs, notes, the log and the card", /Sample Labs/.test(backup) && /PRIVATE NOTE/.test(backup) && /Sam/.test(backup) && /Fall retreat/.test(backup));
  check("Leads file: carries no log entries or adult names", !/Fall retreat|Alex/.test(leads));
  check("Backup: last-backup line updates", /today/.test(await evalJS(`document.getElementById("last-backup").textContent`)));
  await evalJS(`document.getElementById("copy-week").click(); true`); await wait(200);
  const week = await evalJS(`document.getElementById("week-text").textContent`);
  check("Weekly summary: lists this week without notes", /Example Co/.test(week) && /stage: Applied/.test(week) && !/PRIVATE NOTE/.test(week));
  check("Backup: no sideways scroll", await noSideScroll()); await shot("6-backup");

  // A friend imports the leads file into an empty kit page: it lands as "Friend's lead" with no notes.
  await evalJS(`localStorage.clear(); true`); await load(); await tab("backup");
  await evalJS(`document.getElementById("import-text").value = ${JSON.stringify(leads)}; document.getElementById("import-paste").click(); true`);
  const st = await evalJS(`JSON.parse(localStorage.getItem("student-job-toolkit-v1"))`);
  check("Friend import: one lead added as Friend's lead", st.jobs.length === 1 && st.jobs[0].source === "Friend's lead" && st.jobs[0].notes === "");
  // Restoring the full backup merges by id and deletes nothing.
  await evalJS(`document.getElementById("import-text").value = ${JSON.stringify(backup)}; document.getElementById("import-paste").click(); true`);
  const st2 = await evalJS(`JSON.parse(localStorage.getItem("student-job-toolkit-v1"))`);
  check("Restore: backup merges to 2 jobs and 2 log entries, card restored", st2.jobs.length === 2 && st2.exp.length === 2 && /Sam/.test(st2.card));
  check("Restore: a bad file is refused politely", /not a backup/.test(await evalJS(`document.getElementById("import-text").value = "hello"; document.getElementById("import-paste").click(); document.getElementById("import-msg").textContent`)));
  // A javascript: link in an imported file is dropped.
  await evalJS(`document.getElementById("import-text").value = JSON.stringify({kind:"student-job-toolkit-leads",jobs:[{id:"x1",company:"Bad",role:"Link",link:"javascript:alert(1)"}]}); document.getElementById("import-paste").click(); true`);
  check("Import: unsafe links are dropped", await evalJS(`JSON.parse(localStorage.getItem("student-job-toolkit-v1")).jobs.find(j => j.id === "x1").link`) === "");

  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 640, deviceScaleFactor: 2, mobile: true });
  let all320 = true; for (const k of ["log", "resume", "card", "prompts", "jobs", "backup"]) { await tab(k); all320 = all320 && (await noSideScroll()); }
  check("All tabs: no sideways scroll at 320px (small phones)", all320);
} catch (e) {
  check("test run finished", false, e.message);
} finally {
  try { ws && ws.close(); } catch {}
  proc.kill();
  await wait(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
const failed = results.filter((r) => !r.ok).length;
console.log("\n" + (results.length - failed) + " of " + results.length + " checks passed");
process.exit(failed ? 1 : 0);
