# Student Job Toolkit

A free job-search kit for college students and new grads, and for the working adults in their community who want to help.

It works with a free Claude, ChatGPT, or Gemini account by pasting text. No API key, no paid plan, no app, no sign-up, and no personal data in this repo. **Start here: [GUIDE.md](GUIDE.md)** (10 minutes).

## Why another job kit

Trackers, auto-apply bots, resume tailors, and interview apps already exist, and most have free plans. This kit does not compete with them. It covers what they leave out:

- **Service becomes honest resume lines.** An experience log on your own device for what you did in church, campus ministry, small groups, events, tutoring, projects, and part-time work: role, dates, hours, what you did, what you made, who it reached. Plain templates (no AI) turn each entry into resume lines, flag weak verbs and missing dates, keep "About" on estimates, and show each skill with an example. An adult who saw the work can confirm the entry and become a reference.
- **Honest fit, before effort.** A 5-check fit check aimed at the traps that catch students: graduation window and eligibility, work authorization, "entry level, 3+ years required", location, and process. Each check is Pass, Fail, or Unknown, with the line of the post quoted. No guessed Passes.
- **Scam check first.** Fake job offers aimed at students are common, often by text. One prompt checks a message before you click anything: likely scam, check first, or looks real.
- **A person in your field.** The strongest help is 20 minutes with someone who does the work. The kit writes a short, easy-to-decline ask, preps a practice interview, and keeps referral asks honest: only for a role the fit check passes.
- **A community layer.** For a church, campus ministry, or alumni group: a helper opt-in form, a private student request form, a coordinator guide, and a facilitated 4 to 6 evening job club. Working members already post openings; this connects them with the students who need them, without anyone posting a resume in public.
- **Proof of work.** A one-evening plan to build one small, real piece of a job's work from public information, sent next to a short tailored note.
- **Truth throughout.** Every prompt tells the chat to use only what you gave it, label guesses, and keep your facts the same everywhere.

## What is here

| Path | What it is |
|---|---|
| [GUIDE.md](GUIDE.md) | The plain-words guide and the 10-minute start |
| [kit-page/index.html](kit-page/index.html) | One offline page: the experience log, resume lines, your profile card, every prompt with a Copy button that pastes your card in, and backup. Everything stays on the device. It is not a job tracker |
| [prompts/](prompts/) | 9 files: the profile card and 8 prompts, each with what good output looks like and what to say if it goes wrong |
| [community/](community/) | The helper form, the student request form, the coordinator guide, the job club guide and sheet, and a blank "calling and work" page for community leaders |
| [tests/](tests/) | The phone-width test of the kit page, and the free-plan simulation: fixtures, filled prompts, and every answer |
| [tools/](tools/) | `build.mjs` copies the prompts into the kit page; `check.mjs` checks for dashes, emails, and phone numbers |

## Testing

Tested on 2026-11-04 by walking the kit as a student would, with a fictional student ("Sam", an economics senior) and fictional companies. Everything used is in `tests/fixtures/`.

### The kit page at phone width

`tests/phone-test.mjs` opens `kit-page/index.html` from a file (no server, no network) in headless Chromium at 375 by 812 (an iPhone-size screen) and walks every tab: logs two experience entries, reads the resume lines and the skill examples, fills the card, copies a prompt, reloads, exports a backup, restores it twice into an empty page (a new phone), and tries a bad file and a malformed entry. Then it checks every tab at 320 pixels wide.

**Result: 28 of 28 checks pass.** No sideways scroll on any tab at 375 or 320 pixels. Data survives a reload, and a backup restores on a new device without duplicates. Screenshots are in `tests/screenshots/`.

Not tested: a real iPhone or Android browser, and Safari's handling of saved data for pages opened from the Files app. That is why the page tells students to download a backup each week.

### The prompts on a free plan (simulated)

No free account was signed into. Instead, each prompt was filled exactly as a student would paste it (`tests/make-sim-prompts.mjs`) and sent as a brand-new chat, with no tools, no web, and no memory, to two models standing in for free plans: a small fast model and a mid-size model. Every answer is saved next to its prompt in `tests/sim/`.

| Case | What a good answer does | Small model | Mid model |
|---|---|---|---|
| 1. Role profile from a messy background | Quotes evidence, catches "conversational" vs "fluent" Spanish, keeps the estimate on the 10 percent claim, writes ASK ME for missing facts | Pass | Pass |
| 2a. Fit check, a real junior analyst post | APPLY, quotes each line, 3-line note uses only card facts | Pass | Pass |
| 2b. Fit check, a Senior post | SKIP on level | Pass | Pass |
| 2c. Fit check, "Entry Level" title with "3+ years required" | SKIP on level, names the trap | Pass | Pass |
| 3a. Scam check, a normal staffing-agency email | Not a scam: CHECK FIRST or LOOKS REAL | Pass (check first) | Pass (looks real) |
| 3b. Scam check, a fake "equipment check" offer | LIKELY SCAM, do not click, report | Pass | Pass |
| 4a. Warm ask for a 20-minute call | Under 80 words, one ask, easy no | Pass | Pass |
| 4b. Referral ask for a role the fit check skipped | Refuses the referral ask, writes a call ask instead | Pass | Pass |
| 5. Mock interview prep | Questions tied to the post, stories from the card only, keeps "estimate" | Pass | Pass |
| 6. Proof of work, one evening | Rules tied to quoted post lines, open questions, a plan in steps of an hour or less | Pass | Pass |
| 7. Weekly review from a job club row | Flags the 3 quick applies that skipped the fit check and the missed ask | Pass | Pass |
| 8. Polish resume lines | Keeps every fact and "About", adds nothing, picks lines for the post | Pass, one slip (below) | Pass |

**What the test changed.** Round 1 (in `tests/sim-round1/`) used an earlier recruiter-triage prompt that said "if you see any scam sign, stop". Both models then called an ordinary staffing-agency email a scam, because it said "let me know today". The scam check now gives three answers (likely scam, check first, looks real), and both models get the agency email right.

**One slip, fixed and re-run.** In case 8 the small model first rewrote "About 180 students checked in" as "Processed about 180 student check-ins", which credits the student with the whole desk's count (`tests/sim/8-polish-lines.answer-small-before-fix.md`). The mid model asked instead whether 180 was the team's number. Prompt 8 now says not to turn a team or event result into the student's own. Re-run on the small model: "Staffed the fall retreat registration desk, which checked in about 180 students over 2 days", and it flagged the old line as reading bigger than the facts.

**Limits.** A stand-in is not the real free plan. Real free plans may switch to a smaller model after a few messages, cut long answers short (type `continue`), or refuse to open links (paste text). Each prompt plus its pasted inputs is under 900 words, well within any free plan's limit.

## For maintainers

```bash
npm test
```

Runs the build, the text check, and the phone-width test (needs Node 20 or later and any Chrome or Chromium; set `CHROME=/path/to/chrome` if it is not found). To change a prompt, edit its file in `prompts/` and run `npm run build`; the tracker picks it up.

## License

MIT. See [LICENSE](LICENSE).
