# Centspire Outreach Kit

Everything you need to reach as many students as possible between **Oct 23 and Nov 7**. Every message below is ready to send — just fill in the `[brackets]`.

- **Live site:** https://centspire.com/version-5/
- **Printable QR codes for every channel:** `outreach/qr-codes.html`
- **Printable flyer:** `outreach/flyer.html` (pick the channel, then print with "Background graphics" on)

> **Always use the tracking link for the channel you're in.** That's how the impact dashboard shows which outreach worked — which becomes a chart in your written report.

| Channel | Link |
|---|---|
| Classroom sessions | `.../version-5/simulator.html?src=classroom` |
| Lunch pop-up | `.../version-5/simulator.html?src=popup` |
| Hallway posters | `.../version-5/simulator.html?src=poster` |
| Announcements | `.../version-5/?src=announce` |
| Counseling newsletter | `.../version-5/?src=newsletter` |
| Instagram | `.../version-5/?src=instagram` |
| TikTok | `.../version-5/?src=tiktok` |
| Group chats & clubs | `.../version-5/?src=groupchat` |

(`...` = `https://centspire.com`)

---

## Before launch (do these in order)

1. ☐ **Approvals (Dia):** adviser + principal OK for classroom visits, announcements, posters, and a lunch pop-up. Ask whether anonymous, no-name data collection needs any extra notice. Save the approval emails — they're evidence for your Execution section.
2. ☐ **Run the database update (Ari):** Supabase → SQL Editor → paste `version-5/supabase/update-2026-10-23-channels-confidence.sql` → Run. Adds channel and confidence results to the dashboard.
3. ☐ **Freeze the quiz.** Don't change the before/after questions after this point.
4. ☐ **Clear test data (Ari), right before the first real student:** run `version-5/supabase/clear-test-data.sql`. Write the date and time in your project log.
5. ☐ **Record your goals now (whole team)** in the Key Metrics table — before any results come in (see `written/WRITTEN-REPORT-PLAN.md`). Judges value goals set in advance.
6. ☐ **Print:** 15 hallway flyers (`poster`), 2 table signs (`popup`), and the classroom QR code (`classroom`) to project.

---

## 1. Classroom sessions — your biggest lever

One class ≈ 25 completed simulations with near-100% completion and both knowledge checks. **Five classes beats everything else combined.** Target personal finance, economics, business, marketing, and advisory/homeroom teachers.

### Email to teachers

> **Subject:** 20-minute financial literacy activity for your class (student-built, free)
>
> Hi [Teacher name],
>
> We're [Dia, Ari, and Sanskriti], students in [School]'s DECA chapter. For our Financial Literacy project we built **Centspire**, a free website where students play through choosing a college, managing money in college, getting a first credit card, and starting a first job — then get a personalized report and short follow-up lessons.
>
> We'd love to run it with your class for **20 minutes** sometime between **Oct 27 and Nov 7**. We bring everything; students just need a phone or Chromebook. There are no accounts and no names collected — just an anonymous before-and-after quiz so we can measure what students learned.
>
> It covers student loans, budgeting, credit, taxes, and saving, so it fits [personal finance / economics / advisory] well. A one-week follow-up check-in (2 minutes) would help us measure what students remember, if you're open to it.
>
> Would any period work for you? Happy to show you the site first: [link]
>
> Thank you!
> [Names], [School] DECA

### Classroom session plan (20 minutes)

| Time | What happens |
|---|---|
| 0:00–2:00 | Intro: "What would your money look like at 22?" Show the classroom QR code on the board. |
| 2:00–17:00 | Students play. Team members circulate and help. Remind them to finish the final knowledge check — that's what unlocks the report. |
| 17:00–20:00 | Ask 2–3 students what surprised them (great quotes for your report — write them down, no names). Point them to the Academy lessons on their report. |
| **One week later** | Ask the teacher to have students open **My Progress** on the same device/browser and take the 2-minute check-in. |

**Notes:** Students must use the **same device and browser** for the one-week check-in (progress is saved in the browser). If a class uses shared Chromebooks, ask students to use their own phones.

---

## 2. Lunch pop-up — "What's your money at 22?"

- **Setup:** table near the cafeteria, 2 table signs with the `popup` QR code, 1–2 laptops or iPads already open to the simulator.
- **Hook:** "Can you graduate with less than $30K in debt?" Write the best Game Financial Health scores on a whiteboard (first names or initials only, and only if they want).
- **Prize (optional):** small item for the top score each day — log the cost in your budget.
- **Target:** 40 visits (your original goal). Count visitors who scan even if they don't finish.
- **Evidence:** photo of the table (avoid student faces unless you have permission), tally of visitors.

---

## 3. Announcements (≈25 seconds)

> Hey [School]! What would your money look like at 22? DECA students built **Centspire**, a free 10-minute game where you choose a college, handle your first credit card, and start your first job — then see your Financial Future Report. No sign-up. Scan the QR codes around school or find the link in [the school newsletter / our Instagram, @handle]. Can you graduate with less than thirty thousand in debt? Find out at lunch this [day] at our table by the cafeteria!

---

## 4. Counseling newsletter blurb

> **Try Centspire: a free money simulator built by [School] DECA students**
> Before you sign a loan or a lease, practice the decisions. In 10–15 minutes, Centspire walks you from comparing college offers to your first paycheck, explains what each choice costs, and gives you a personalized report with short lessons on financial aid, budgeting, credit, and taxes. No account or names required.
> Play: [newsletter link]

---

## 5. Social media (Instagram / TikTok)

Post from your DECA chapter account and your own accounts. Put the matching link in your bio.

1. **Hook reel (launch day):** screen-record a run-through. Text: *"POV: you pick the dream school and find out what it costs at 22 😬"* → end on the report. Caption: *"We built a free game that shows where your money choices lead. Link in bio. #financialliteracy #DECA"*
2. **Myth vs. fact carousel:** "A 22% tax bracket means you pay 22% on everything" ❌ → explain brackets (from the Tax Brackets lesson). Final slide: "Learn more in 3 minutes → link in bio."
3. **Challenge post:** *"Can you beat a Game Financial Health score of 80? Comment your score."*
4. **Behind the scenes:** the team building and testing it — shows the project-management side and is good evidence for your report.

Screenshot each post's views/likes on **Nov 7** for your Monitoring section.

---

## 6. Group chats & clubs

> We made a free money game for our DECA project — choose a college, survive your first credit card, get a Financial Future Report. Takes ~10 min, no sign-up. Would mean a lot if you tried it and finished the last quiz (it's how we measure if it works 🙏) [groupchat link]

Ask leaders of FBLA, NHS, student council, and other clubs to forward it.

---

## 7. Track it as you go (for your Monitoring & Controlling section)

Every day during outreach, one person opens the **impact dashboard** (`version-5/impact.html`, sign in with your team email) and fills one row:

| Date | Participants | Sim completions | Paired pre/post | Top channel | Issue noticed | Action taken |
|---|---|---|---|---|---|---|
| | | | | | | |

Problems you hit and how you fixed them (low completion, a confusing screen, a teacher cancellation) go straight into your **Controlling** table — that section is worth 10 points.
