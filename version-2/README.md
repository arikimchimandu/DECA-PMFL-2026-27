# Swipe Through College — v2

A swipe-card money game for high schoolers, by the centsible. team.

| File | What it is |
|---|---|
| `index.html` | The game |
| `dashboard.html` | Team dashboard: visits, completion, quiz before/after, channels, choices, CSV export |
| `content.js` | **All cards, lessons, quiz questions, and personalities.** Reviewers edit this file. |
| `config.js` | Optional shared-database settings |
| `game.js`, `data.js`, `styles.css` | Game code, data saving, styling |

## How a game works

1. Nickname → 4-question warm-up quiz
2. 10 swipe cards from senior year to first job (6 core cards + 3 random + 1 random plot twist, so replays differ)
3. Same 4 questions again to "unlock" the money personality card
4. Results: personality card, score, before/after quiz, recap, share image, friend-challenge link

Replays skip the quizzes.

## Tracking links

Add `?src=` to every link you hand out so the dashboard can compare channels:

- QR code at the pop-up: `index.html?src=popup`
- Instagram/TikTok: `index.html?src=social`
- Counseling newsletter: `index.html?src=newsletter`
- School announcements: `index.html?src=announce`

Friend-challenge links add `?beat=<score>&by=<nickname>&src=friend` automatically.

## Sharing data across devices (Supabase, free)

Without this, each phone keeps its own data and the dashboard only shows the device it's opened on.

1. Create a project at supabase.com.
2. In **SQL Editor**, run:

```sql
create table events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('visit', 'start', 'finish')),
  src text,
  data jsonb
);
alter table events enable row level security;
create policy "anyone can add events" on events for insert to anon with check (true);
create policy "anyone can read events" on events for select to anon using (true);
```

3. In **Project Settings → API**, copy the Project URL and the `anon` `public` key into `config.js`.

Note: the read policy means anyone with the site's key can read the events (nicknames, scores, choices). No real names or contact info are collected — keep it that way.

## Putting it online

It's a static site — no build step. Drag the `version-2` folder onto Netlify Drop (app.netlify.com/drop), or use GitHub Pages or Vercel.

## Before launch: review checklist

- [ ] Financial reviewer checks every dollar figure and lesson in `content.js`
- [ ] Technical reviewer tests on iPhone + Android, with sound on/off, and with a screen reader
- [ ] 5+ students play-test; note confusing cards and wording
- [ ] Supabase connected; dashboard shows data from two different phones
- [ ] QR code generated from the `?src=popup` link
