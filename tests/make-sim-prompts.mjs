// Fills each prompt with a fictional student's card and test inputs, exactly as a student would paste it,
// and writes the result to tests/sim/<case>.prompt.txt. Each file is one new free-plan chat.
// Usage: node tests/make-sim-prompts.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fx = (f) => readFileSync(join(root, "tests", "fixtures", f), "utf8").trim();
const prompt = (f) => readFileSync(join(root, "prompts", f), "utf8").match(/```text\n([\s\S]*?)\n```/)[1];
const blankCard = prompt("00-profile-card.md");
const card = fx("card.txt");
const fill = (text, slots) => { for (const [k, v] of Object.entries(slots)) text = text.split(k).join(v); return text; };
const C = "[PASTE YOUR PROFILE CARD HERE]";
function mode(text, keep) { return text.split("\n").filter((l) => !/^- (FOLLOW UP|THANK YOU|ASK FOR FEEDBACK|THEY ANSWERED|NUMBER FIRST):/.test(l) || l.startsWith("- " + keep + ":")).join("\n").replace("Mode (keep one, delete the rest):", "Mode:"); }

const cases = {
  "1-role-profile": fill(prompt("01-role-profile.md"), { "[PASTE YOUR BACKGROUND HERE]": fx("background.txt"), "[ANSWER HERE]": "Something with data, near Sacramento. Not sure which title.", [C]: blankCard }),
  "2a-match-fit": fill(prompt("02-match-test.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-fit.txt") }),
  "2b-match-senior": fill(prompt("02-match-test.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-senior.txt") }),
  "3a-triage-agency": fill(prompt("03-triage-message.md"), { [C]: card, "[PASTE THE MESSAGE HERE]": fx("msg-agency.txt") }),
  "3b-triage-scam": fill(prompt("03-triage-message.md"), { [C]: card, "[PASTE THE MESSAGE HERE]": fx("msg-scam.txt") }),
  "4-number-first": fill(mode(prompt("04-other-replies.md"), "NUMBER FIRST"), { [C]: card, "[PASTE THE THREAD HERE]": fx("thread-number-first.txt") }),
  "5-proof-of-work": fill(prompt("05-proof-of-work.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-fit.txt"), "[for example, one weekend, about 8 hours]": "one weekend, about 8 hours", "[for example, Google Sheets, Python, Figma, a plain web page]": "Google Sheets, SQL (PostgreSQL), Tableau Public" }),
  "6-weekly-review": fill(prompt("06-weekly-review.md"), { [C]: card, "[PASTE YOUR WEEK HERE]": fx("week.txt") }),
  "7-daily": fill(prompt("07-daily-ten-minutes.md"), { [C]: card, "[PASTE THE MESSAGES HERE]": fx("daily.txt") }),
};
mkdirSync(join(root, "tests", "sim"), { recursive: true });
for (const [k, v] of Object.entries(cases)) {
  if (/\[PASTE [A-Z ]+ HERE\]/.test(v)) throw new Error(k + ": a slot is still empty");
  writeFileSync(join(root, "tests", "sim", k + ".prompt.txt"), v + "\n");
}
console.log("wrote " + Object.keys(cases).length + " filled prompts to tests/sim/");
