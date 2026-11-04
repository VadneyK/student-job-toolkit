Honest limit first: you have one evening, about 3 hours, and no real data from the company. So this sample must use made-up data, labeled as made up. It can show how you think and write SQL. It cannot show what Lakeview's waste numbers look like. Every piece of it is labeled "Unofficial work sample, not affiliated with Lakeview Grocers Co-op." No logo, no private data.

## 1. Three ideas

| # | Line of the post it comes from | What you would build | Public source its rules come from |
|---|---|---|---|
| A | "flag stores where waste is rising" | A SQL query on made-up weekly waste for 14 stores that flags stores whose waste rose two weeks in a row, plus a small chart of the flagged stores in Google Sheets. | ISO 8601 for what a week is; PostgreSQL documentation for `date_trunc` and the `lag` window function. |
| B | "Build and maintain weekly dashboards" | A one-page Tableau Public dashboard of made-up weekly sales and waste for 14 stores. | Tableau Public help pages for publishing and sharing; ISO 8601 for weeks. |
| C | "answer questions from store managers with SQL" | A short Q&A: three plausible store-manager questions, each answered with one SQL query and two plain sentences. | PostgreSQL documentation for the SQL features used. |

## 2. Best one for you

Pick A. It matches the clearest job duty in the post and gives you something to say in the "60-minute SQL exercise" step. It also fits 3 hours and uses only tools you already know (SQL on PostgreSQL, Google Sheets).

## 3. Rules it follows

- **R1.** A week is an ISO 8601 week, starting on Monday. Source: ISO 8601; PostgreSQL `date_trunc('week', ...)` also starts weeks on Monday. (Assumption: the company's week may differ. See open questions.)
- **R2.** The data covers 14 stores. Post line: "understand sales, waste and staffing across 14 stores."
- **R3.** The data is made up, generated in SQL with a fixed random seed so anyone can rerun it. It is labeled "synthetic" everywhere. Source: your own rule, no private or real data.
- **R4.** Waste is counted per store per week in pounds. This unit is my assumption, not from the post (guess).
- **R5.** "Rising" means this week's waste is higher than last week's, and last week's was higher than the week before. Post line: "flag stores where waste is rising." The two-week rule is my assumption, not the company's. Mechanics come from the PostgreSQL `lag` function documentation.
- **R6.** The query has comments in plain words. Post line: "clear writing."
- **R7.** The sample is labeled "Unofficial work sample, not affiliated with Lakeview Grocers Co-op." It uses no logo.
- **R8.** Only tools on your list are used: PostgreSQL, Google Sheets, and (if time) Tableau Public.

## 4. Open questions only the company can answer

Write these down instead of guessing:
1. What counts as "waste": spoiled food, unsold food, donated food, or all of it?
2. What unit do you measure it in: pounds, dollars, or items?
3. What does "rising" mean to your team: one week up, a trend over weeks, or a percent jump?
4. Should waste be compared to last week, to the store's own average, or to its sales?
5. Which day does your reporting week start on?
6. Who gets the flag, and how fast do they need it?

## 5. Build plan (each step is an hour or less)

1. **0:00 to 0:45. Make the data.** In PostgreSQL, create a `stores` table with 14 rows and a `weekly_waste` table with 12 weeks per store using `generate_series`. Set a fixed seed so results repeat. Add a comment on both tables: "synthetic data."
2. **0:45 to 1:45. Write the query.** Total waste per store per ISO week, use `lag` to get the previous two weeks, and flag stores where both changes are increases. Check two stores by hand to confirm the flag is right.
3. **1:45 to 2:30. Show the result.** Paste the flagged-stores result into a Google Sheet, add one simple chart, and put the SQL on its own tab.
4. **2:30 to 3:00. Write it up.** Add the README tab, the open questions, and the label. Set the sheet to view-only link sharing. If you finish early and want more, put the same table on Tableau Public. If you run out of time, cut Tableau and keep the Sheet.

## 6. README outline

- **What it does.** Flags stores where weekly waste rose two weeks in a row, on made-up data for 14 stores. Labeled: "Unofficial work sample, not affiliated with Lakeview Grocers Co-op."
- **How to run it.** Run the setup SQL, then the flag query, in PostgreSQL. Note the seed.
- **What I decided and why.** R1 to R5, each with one sentence of why. Say plainly which are assumptions.
- **What is left.** Normalizing for store size or sales, using real units, handling missing weeks, a dashboard.
- **Open questions.** The six above.
- **Credit.** ISO 8601, PostgreSQL documentation, and any tutorial or example you used.

## 7. Three-line note to send with it

I built a small unofficial work sample for the Junior Data Analyst role: a SQL query that flags stores where weekly waste rose two weeks in a row, using made-up data for 14 stores.
The decision I'd most like your view on is what "rising" should mean for your team.
Link: [LINK]
