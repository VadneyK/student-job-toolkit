Note before the plan: I cannot browse the web in this chat. Public sources below are ones I know exist, but check the exact page and the current terms yourself before you use them. All data in the build is invented by you and labeled as such. Nothing here uses Lakeview Grocers Co-op's logo, data or name in the files except in the note "unofficial work sample for the Junior Data Analyst post".

## 1. Three ideas (each one step of the work in the post)

| # | Line of the post it comes from | What you would build | Public source its rules come from |
|---|---|---|---|
| A | "flag stores where waste is rising" | A PostgreSQL query that flags stores whose recent waste is rising, run on an invented table of 14 stores over 26 weeks, plus a small Tableau Public view of the flagged stores. | PostgreSQL documentation (window functions such as LAG, and date functions). The meaning of "rising" is NOT in the post, so it becomes an open question. |
| B | "Build and maintain weekly dashboards" | A one-page weekly dashboard on Tableau Public. Real public data stand-in: US Census Bureau Monthly Retail Trade numbers for food and beverage stores, shown monthly because weekly data is not public (inference). | Census Bureau Monthly Retail Trade survey pages (check the current series name) and Tableau Public help pages. |
| C | "answer questions from store managers with SQL" | Three plain-English manager questions, each answered with one SQL query and a two-sentence written answer, on the same invented data as A. | PostgreSQL documentation. The three questions are your guesses, so they are open questions too. |

## 2. Best one for you

Pick A. It is the one line in the post that matches your own food-waste sheet, it uses the SQL you already know, and it fits in 8 hours. It also gets you ready for the 60-minute SQL exercise.

## 3. Rules the build follows

- R1: Use 14 stores. Post: "across 14 stores".
- R2: Data and results are by week. Post: "weekly dashboards".
- R3: The flag is written in SQL. Post: "answer questions from store managers with SQL".
- R4: The flag marks stores where waste is rising. Post: "flag stores where waste is rising".
- R5: The view is a Tableau Public dashboard. Post: "Tableau or Power BI preferred".
- R6: Write a short, plain note a store manager could read. Post: "clear writing".
- R7: Use LAG and a 4-week average, not guesses, to compare periods. Source: PostgreSQL documentation, window functions. (This is a technique choice, not a company rule.)
- R8: All data is invented and labeled "invented sample data". Everything is labeled "Unofficial work sample." No company logo, no private data. Source: your own rules for this project.
- R9: Dollars of waste are measured as a share of sales ("waste rate") so big and small stores compare fairly. This is my assumption, not from the post. It goes on the open questions list.

## 4. Open questions (only the company can decide)

- Is waste counted in dollars, pounds, or items?
- What counts as "rising": how many weeks, how big a change, and over what comparison period?
- Is waste compared as a rate (share of sales) or in raw amounts?
- Should big and small stores be judged the same way?
- Which kinds of waste count (spoiled, damaged, donated, theft)?
- Who gets the flag, how often, and what should they do with it?
- Where does the "staffing" data come from, and how is it measured?
- Does the tool they use already flag stores in a different way?

## 5. Build plan (about 8 hours, each step an hour or less)

1. 45 min: write R1 to R9 and the open questions in a plain text file.
2. 45 min: in PostgreSQL, create tables: stores (14 rows), weekly_results (store, week start, sales, waste, labor hours).
3. 60 min: fill the tables with invented data using generate_series and random(). Make 3 stores trend up on purpose so there is something to find. Label the table "invented".
4. 60 min: write query 1: weekly waste rate per store.
5. 60 min: write query 2: use LAG and a 4-week average to compare the latest 4 weeks to the 4 weeks before; flag stores above your chosen change. Write down the number you chose as an assumption.
6. 60 min: sanity checks. Do the 3 stores you made rise get flagged? Does any other store get flagged by accident? Fix the rule or write down the limit.
7. 60 min: export the result as CSV, build one Tableau Public dashboard (flagged list plus a trend line per store).
8. 60 min: write the README, the manager note, and the 3-line message. Cut query 3 and idea C if you are behind.

## 6. README outline

- Title: "Waste flag sample: unofficial work sample for a Junior Data Analyst post"
- What it does: flags stores where waste is rising, in SQL, with a dashboard.
- How to run it: install PostgreSQL, run the create and data files in order, run the flag query, open the dashboard link.
- What I decided and why: waste as a share of sales; 4-week compared to the prior 4 weeks; the flag size I chose and why.
- What is left: real data, testing other flag rules, staffing view.
- Open questions: the list above.
- Credit: PostgreSQL documentation; Tableau Public. Data is invented. Not affiliated with any company.

## 7. The 3-line note

Hi, I built a small unofficial work sample for the Junior Data Analyst role: a SQL flag for stores where waste is rising, with a Tableau Public dashboard, using invented data for 14 stores.
The decision I'd most like your view on: should "rising" be measured as waste as a share of sales, and over how many weeks?
Link: [your link]. Sam
