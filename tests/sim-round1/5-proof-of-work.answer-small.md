**Label for everything you publish:** "Unofficial work sample. Not made for or with Lakeview Grocers Co-op. Uses public data only."

**1. Three ideas (each one step of the post)**

1. **Store questions in SQL (recommended).** Post line: "answer questions from store managers with SQL." Build: five questions a store manager might ask (for example, which stores sold the most each week, and which stores changed most), each answered with one SQL query, a result table, and one plain sentence. Public source: a free grocery sales dataset on Kaggle or a similar site. Check the license and the columns first.
2. **One weekly dashboard.** Post line: "Build and maintain weekly dashboards." Build: one Tableau Public chart of weekly sales by store, from the same dataset. Public source: the same dataset and Tableau Public's terms.
3. **Rising-store flag in Google Sheets.** Post line: "flag stores where waste is rising." Build: a sheet that marks a store when its weekly figure rises two weeks in a row. Problem: a sales dataset usually has no waste column, so you would need a proxy (for example, discounted items), and the flag would only be as good as that proxy. Weakest of the three.

**2. Best pick for you: idea 1.** It uses your strongest skill (SQL, intermediate) and it is the same kind of task as the post's 60-minute SQL exercise. Eight hours is enough for five queries and one chart, but not for a full dashboard or a waste model.

**3. Rules the work follows**
- R1: Each answer is one SQL query. (Post: "answer questions from store managers with SQL.")
- R2: Each answer shows the query, the result, and one plain sentence. (Post: "clear writing.")
- R3: The store is the unit of analysis, as in the post's own framing. (Post: "across 14 stores.") If the dataset has fewer stores, say so.
- R4: Claims stay within the data. No waste claims, since the dataset has no waste column. (Public source: the dataset's column list.)
- R5: No company logo or private data is used. The company name appears only in the unofficial label. (Your rule for this project.)
- R6: Credit the dataset and follow its license. (Public source: the dataset's license page.)

**4. Open questions (only the company can decide)**
- What counts as waste, and how is it measured?
- Which week starts the reporting week?
- Which sales or staffing figures does the operations team track each week?
- How far back does their history go?
- Do store managers log their questions anywhere?

**5. Build plan (about 8 hours, one hour per step)**
1. Pick a public grocery sales dataset with store, date, and sales columns. Check the license. Write the source in a notes file.
2. Load the data into PostgreSQL. Check row counts and blank values.
3. Write queries 1 and 2: sales by store by week, and top items per store.
4. Write queries 3 and 4: week-over-week change by store, using a window function (LAG).
5. Write query 5: which stores changed most. Check one store by hand.
6. Make one chart in Tableau Public from query 4.
7. Write the README and a one-page summary of the five answers.
8. Review each query against its question. Publish to GitHub and Tableau Public. Send the note.

**6. README outline**
- What it does (one paragraph, with the unofficial label)
- How to run it (database setup and the order of the queries)
- What I decided and why (dataset choice, week definition, stores as unit)
- What is left (waste measure, anything not covered)
- Open questions (the list above)
- Credit (dataset name, license, and link)

**7. Note to send with it (3 lines)**

I built a short set of SQL answers and one chart, using a public grocery sales dataset. This is an unofficial work sample, not made for or with your company. The decision I would most like your view on is how you measure waste, since the public data has no waste column.

Link: [paste your GitHub or Tableau Public link]
