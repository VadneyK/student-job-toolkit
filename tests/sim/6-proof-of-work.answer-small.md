Honest scope: in one evening (about 3 hours) you can build one SQL query and one chart, using made-up data. A full weekly dashboard or real store data is more than one evening.

## 1. Three ideas

| # | Post line it comes from | What I would build | Public source for its rules |
|---|---|---|---|
| A | "flag stores where waste is rising" | A SQL query that flags stores whose waste rose, plus one Tableau Public chart of the flagged stores | None needed. The rule comes from the post. |
| B | "Build and maintain weekly dashboards" | A Google Sheet with a weekly summary tab and one chart, plus a note on how to paste a new week | None needed. |
| C | "answer questions from store managers with SQL" | Five typical manager questions, each answered with one SQL query on a made-up table | USDA Economic Research Service food loss and waste estimates, for background only. Check the current version before citing. |

## 2. Best idea for you: A

It covers SQL, Tableau, and the core job of flagging waste, and one query plus one chart fits your time.

## 3. Rules the project follows

- R1. Use made-up data only, and label every sheet and chart "synthetic." Source: your brief, "Do not use the company's logo or private data."
- R2. Label the work "unofficial work sample" in the README, chart title, and note. Source: your brief.
- R3. Flag stores where waste is rising. Source: post, "flag stores where waste is rising."
- R4. Answer the flag question with SQL. Source: post, "answer questions from store managers with SQL."
- R5. Show the result by week. Source: post, "Build and maintain weekly dashboards."
- R6. Make the chart in Tableau Public. Source: post, "Tableau or Power BI preferred."
- R7. My choice, not from the post: "rising" means waste up more than 10 percent over the last 4 weeks compared with the 4 weeks before.

## 4. Open questions for the company

1. What counts as waste (pounds, dollars, or units), and where is it recorded?
2. Should waste be compared with sales or customer count for each store?
3. How often should flags go out: weekly or daily?
4. Is "rising" a fixed percent, or a comparison with other stores?
5. Do all 14 stores record waste the same way?

## 5. Build plan (each step under an hour, about 3 hours total)

1. 0:00 to 0:40: Make a sample table of 14 stores over 12 weeks, with columns store_id, week_start, and waste_lbs. Name the file "synthetic."
2. 0:40 to 1:20: Load it into PostgreSQL. Write the flag query: average waste for the last 4 weeks against the 4 weeks before, per store, flagging a rise over 10 percent (R7).
3. 1:20 to 2:00: Build one line chart in Tableau Public of weekly waste for the flagged stores. Title it with "synthetic" and "unofficial work sample."
4. 2:00 to 2:40: Write the README (outline below) and the note (below).
5. 2:40 to 3:00: Buffer. Check every label, and remove anything that could look like a real company asset.

## 6. README outline

- What it does: flags stores where waste rose, using a made-up table.
- Status: unofficial work sample. Not made by or for any company. Synthetic data only.
- How to run: create the table, load the CSV, run the query file, open the Tableau Public workbook.
- What I decided and why: the 4-week windows and 10 percent threshold (my choice), SQL for the query, Tableau for the chart.
- What is left: real data, a weekly refresh, a Power BI version.
- Open questions: the list in section 4.
- Credit: none, or the USDA source if I use it.

## 7. Note to send with it

Unofficial work sample: a SQL query and Tableau Public chart that flags stores where waste is rising, built on made-up data for 14 stores over 12 weeks.

The decision I would most like your view on: how to define "rising." I used more than 10 percent over the last 4 weeks against the 4 weeks before. Is that close to how your team measures it?

Link: [Tableau Public link, added after publishing]
