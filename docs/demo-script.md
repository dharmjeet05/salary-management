# Demo script

A walkthrough of about 4 minutes, recorded on the live site, https://dharmjeet.com/salary-management. It follows the HR manager's day first, then shows how it was built.

Before recording: re-seed (`docker exec salary-management node dist/seed.js`), so the numbers match a fresh demo.

## 1. The problem (15 s)

Show: the employees page.
Say: ACME's HR manager keeps salaries for 10,000 people in 8 countries in Excel. This replaces that: find people, fix salaries, and answer "how do we pay people", always in each country's own currency.

## 2. Find someone fast (45 s)

1. Point at the count: "10,000 employees"
2. Type `asha` in "Search by name or email". One request after typing stops
3. Hover the Salary header: "Pick a country to sort by salary"
4. Pick India in "All countries", then Engineering in "All departments", then sort by salary, highest first
5. Go to page 2, then copy the URL into a new tab. The same view opens

Say: salaries are in different currencies, so the app only sorts them inside one country.

## 3. Fix a salary (45 s)

1. Click a name. The edit page opens
2. Clear the name and save: "Enter a name"
3. Change the department: the job title resets, since a title must belong to its department
4. Put the name back, raise the salary, save: "Changes to <name> were saved"
5. It lands back on the same filtered list, page 2, with the new salary

## 4. Add and delete (25 s)

1. "Add employee", fill it in with an email that already exists: "This email is already used by another employee"
2. Fix the email, save: "<name> was added"
3. Delete that person, confirm: "<name> was deleted"

## 5. How ACME pays people (60 s)

1. Open Insights. "Pay by country": people, median, average, lowest and highest, each in its own currency
2. Pick India. "Cost by department" and "Pay by job title" answer "what do we pay a Senior Software Engineer in India" without a spreadsheet
3. "Paid well below their peers": people under 80% of the median for their job title in India. Switch to 70%: the list gets shorter
4. Click a name, raise the salary to the median, save. Back on insights, that person is off the list

## 6. How it was built (40 s)

1. The README: the live link, the architecture diagram, the numbers
2. `docs/SPEC.md`: the one page requirements were the first commit, before any code
3. One issue, then its PR: the task checklist, the review comments posted on the PR, the fix commits, all resolved
4. `pnpm test`: 339 tests in about 9 seconds, on a real Postgres in process
5. `docs/ai-usage.md`: how the AI was set up, and where it was wrong and how that was caught

Close: the repo link, https://github.com/dharmjeet05/salary-management
