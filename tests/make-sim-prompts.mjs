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
// (round 1 used a mode picker for the old reply prompt; kept for its fixtures in tests/sim-round1)
function mode(text, keep) { return text.split("\n").filter((l) => !/^- (FOLLOW UP|THANK YOU|ASK FOR FEEDBACK|THEY ANSWERED|NUMBER FIRST):/.test(l) || l.startsWith("- " + keep + ":")).join("\n").replace("Mode (keep one, delete the rest):", "Mode:"); }

const cases = {
  "1-role-profile": fill(prompt("01-role-profile.md"), { "[PASTE YOUR BACKGROUND HERE]": fx("background.txt"), "[ANSWER HERE]": "Something with data, near Sacramento. Not sure which title.", [C]: blankCard }),
  "2a-fit-good": fill(prompt("02-match-test.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-fit.txt") }),
  "2b-fit-senior": fill(prompt("02-match-test.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-senior.txt") }),
  "2c-fit-entry-level-trap": fill(prompt("02-match-test.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-trap.txt") }),
  "3a-scam-check-agency": fill(prompt("03-scam-check.md"), { [C]: card, "[PASTE THE MESSAGE HERE]": fx("msg-agency.txt") }),
  "3b-scam-check-scam": fill(prompt("03-scam-check.md"), { [C]: card, "[PASTE THE MESSAGE HERE]": fx("msg-scam.txt") }),
  "4a-warm-ask-call": fill(prompt("04-warm-ask.md"), { [C]: card, "[WHO THEY ARE]": fx("helper.txt"), "[MY ASK]": "a 20-minute call", "[PASTE THE FIT CHECK HERE, OR WRITE NONE]": "NONE" }),
  "4b-warm-ask-referral-skip": fill(prompt("04-warm-ask.md"), { [C]: card, "[WHO THEY ARE]": fx("helper.txt"), "[MY ASK]": "a referral for one role: Senior Data Analyst at their hospital system", "[PASTE THE FIT CHECK HERE, OR WRITE NONE]": fx("fit-skip.txt") }),
  "5-mock-interview": fill(prompt("05-mock-interview.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-fit.txt"), "[WHAT THEY DO]": "data analyst at a regional hospital system" }),
  "6-proof-of-work": fill(prompt("06-proof-of-work.md"), { [C]: card, "[PASTE THE JOB POST HERE]": fx("post-fit.txt"), "[for example, one evening, about 3 hours]": "one evening, about 3 hours", "[for example, Google Sheets, Python, Figma, a plain web page]": "Google Sheets, SQL (PostgreSQL), Tableau Public" }),
  "7-weekly-review": fill(prompt("07-weekly-review.md"), { [C]: card, "[PASTE YOUR WEEK HERE]": fx("club-row.txt") }),
  "8-polish-lines": fill(prompt("08-polish-resume-lines.md"), { [C]: card, "[PASTE YOUR EXPERIENCE LINES HERE]": fx("experience-lines.txt"), "[PASTE THE JOB POST HERE, OR WRITE NONE]": fx("post-fit.txt") }),
};
mkdirSync(join(root, "tests", "sim"), { recursive: true });
for (const [k, v] of Object.entries(cases)) {
  if (/\[PASTE [A-Z ]+ HERE\]/.test(v)) throw new Error(k + ": a slot is still empty");
  writeFileSync(join(root, "tests", "sim", k + ".prompt.txt"), v + "\n");
}
console.log("wrote " + Object.keys(cases).length + " filled prompts to tests/sim/");
