# Centspire V5

**Make smarter money decisions before they become real ones.**

Centspire is a free financial literacy web app for high school students, built for DECA Project Management – Financial Literacy (2026–27). It has two connected experiences:

1. **Financial Life Simulator** — a 10–15 minute, four-chapter branching journey (Senior Year → College Life → Independence → First Job) with a Challenge Score and rewards, ending in a personalized **Financial Future Report**.
2. **Centspire Academy** — 19 short lessons in 6 pathways (including Scams & Digital Money), 7 Money Missions, four Money Tools calculators, and a My Progress dashboard.

No account or email is required. Students can optionally save across devices with a save code. See [CHANGES.md](CHANGES.md) for what's new in V5.

---

## Run it locally

No build step and no dependencies. From the repository root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/version-5/>.

> Opening `index.html` directly from Finder also works for most pages, but browsers limit some features (like saving progress) on `file://` pages. Use the local server above when testing.

## Run the tests

**In a browser (no installs needed):** with the local server running, open <http://localhost:8000/version-5/tests/>. The page runs all tests and shows pass/fail.

**With Node.js 18+ (optional):**

```bash
node version-5/tests/run-node.js
```

**Check that every local link works:**

```bash
python3 version-5/tests/check_links.py
```

The 99 automated tests cover:
- Loan amortization, credit card payoff, savings growth, compound interest, taxes and paychecks, and budget math, checked against hand-calculated values.
- Every number quoted in a lesson, mission or quiz explanation, recomputed with the finance module.
- Branching game state: options that appear or disappear based on earlier choices, blocked budgets, going back to change a decision, and saved games restoring exactly.
- Assessment scoring, learning scores, the rule that clicking through a lesson is never a pass, and lesson recommendations.
- Saved progress, reset, corrupted-data recovery, and returning-visitor detection.
- Content integrity: valid answer keys, no repeated questions, and every concept linked to a lesson.
- The impact summary math and the rule that demo mode never records data.
- V5: the senior-year car (borrowing, payments left at the first job, selling vs. keeping), the phishing decision, Challenge Score scaling, reward thresholds and claim codes, merging progress from two devices, V4 progress import, Net Promoter Score math, and every number quoted in the car and scam content.

## Deploy (GitHub Pages)

V5 is plain static files, so GitHub Pages serves it as-is from the `main` branch alongside V1–V4:

`https://arikimchimandu.github.io/DECA-PMFL-2026-27/version-5/`

After editing CSS or JS, bump the `?v=5.0.0` version in the HTML `<script>`/`<link>` tags so browsers load the new files.

## Connecting Supabase (shared data, save codes, team dashboard, reward claims)

`config.js` already has the project URL and anon key. V5 uses **new tables**, so it needs one setup step before shared data, save codes, the team dashboard, or claim checking work. Until then everything else works and data stays on each device.

1. Supabase → **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql). (V4's tables are left alone.)
2. Set the **team code**. It unlocks the impact dashboard and reward-claim checks. Use at least 8 characters; a short phrase works well. Run it in a **new** query so the code isn't saved alongside the setup file:
   ```sql
   select public.v5_set_team_code('your team code here');
   ```
   Run the same line again any time to change the code. The old one stops working immediately.
3. Open `impact.html`, enter the team code, and check that it says "Actual data from the shared database". Then try **My Progress → Get a save code**.

**Privacy design:**
- The public key can only *add* events; there's no read policy. Dashboard totals and claim checks only work with the team code, which the database checks against a bcrypt hash (the code itself is never stored). After 20 wrong tries in 10 minutes, code checks pause for 10 minutes. Anyone could trigger that pause by guessing on purpose, but they still can't get in.
- The team code is remembered only until the browser tab closes. Change it if it leaks, and never give it to students.
- Team pages (`impact.html`, `demo.html`, `tests/`) aren't linked from the public site and ask search engines not to index them. The repository is public, so the demo and tests pages are unlisted rather than secret — they contain no student data.
- Save-code progress has no name or email and can only be loaded with the exact 12-character code.
- Nobody signs in or gives an email: students use save codes, and the team uses the team code.
- **Never put the `service_role` key in this repository.**

> The SQL follows standard Supabase conventions but hasn't been run against a live project yet. If a statement errors, copy the error message and fix that statement before going live.

## Rewards

Wording and thresholds are in `config.js` → `rewards` (set `enabled: false` to turn them off). Students who earn a reward get a claim code like `CS-7BK4-9EE7` on their report. At the table, open `impact.html` → **Check a reward claim**, type the code, and mark it as given out so it can't be reused (the dashboard must be unlocked with the team code).

Limits: the check confirms a reward was recorded, but a determined student could fake an event through the public API, or replay after clearing their browser. That's acceptable for small prizes; enforce "one per student" at the table.

## How it fits together

```
version-5/
  index.html  simulator.html  report.html  academy.html  lesson.html  mission.html
  tools.html  progress.html  about.html  impact.html (team)  demo.html (presenters)
  config.js                    Supabase settings, team credits, reward wording
  assets/css/app.css           Design system (navy · mint · cream · gold)
  assets/js/lib/
    assumptions.js             ← every rate, limit, and price, with sources
    finance.js                 Pure financial math (tested)
    mastery.js                 Learning scores + recommendations (tested)
    store.js                   Progress saved in this browser (tested)
    analytics.js               Anonymous impact events + summaries (tested)
    rewards.js                 Challenge Score, accuracy, claim codes (tested)
    cloud.js                   Save codes through Supabase
    icons.js  ui.js  widgets.js  Shared UI, icon set, interactive calculators
  assets/js/content/           ← all student-facing text lives here
    assessments.js             Equivalent pre/post forms A and B
    lessons.js                 5 pathways, 15 lessons
    missions.js                Money Missions (weekly rotation)
    concepts.js                Concept map linking questions ↔ lessons ↔ missions
  assets/js/sim/
    engine.js                  Branching simulator model (no UI; tested)
    report-builder.js          Financial Future Report logic (tested)
  assets/js/pages/             One small controller per page
  supabase/schema.sql          Events, team-only summary, save codes, claims
  tests/                       Browser/Node tests and link checker
```

### Adding content

- **A lesson:** copy an entry in `content/lessons.js`, give it a new `id`, tag its `concepts`, and pick a `widget` type from `widgets.js`. The content tests will tell you if anything is missing.
- **A Money Mission:** append an object to `content/missions.js`. The weekly mission rotates automatically.
- **A number:** change it in `assumptions.js`. If a lesson quotes it, update the test in `tests/content.test.js` too.

## Presenting at DECA

Open `demo.html?demo=1` (linked at the bottom of the About page). It walks through six steps:
1. A decision.
2. Choices carrying forward.
3. A sample report.
4. A recommended lesson.
5. A calculator.
6. How impact is measured.

Demo mode saves nothing and records nothing. Sample data is always labeled. Once loaded, the demo works without internet (only the web fonts need a connection; it falls back to system fonts).

## Accuracy

Real-world figures, with sources listed in `assumptions.js` and on the About page:
- federal Direct Loan rates for 2025–26
- dependent loan limits
- 2026 federal tax brackets and the standard deduction (IRS Rev. Proc. 2025-32)
- FICA rates

**Before ICDC, have the financial reviewer confirm these, especially the 2026 tax figures.** All colleges, jobs and offers are hypothetical and labeled as such. Centspire is educational, not financial advice.
