-- Centspire V4 — Supabase setup (run once in the Supabase SQL Editor).
--
-- Privacy model
--   * The public (anon key) may INSERT events only. There is no SELECT policy, so nobody using the
--     public key can read individual participant records.
--   * The team dashboard calls v4_impact_summary(), which returns aggregate numbers only.
--   * Events contain a random participant UUID and small numeric data — no names, emails, or school IDs.
--   * Never put the service_role key in the website. Only the anon (public) key belongs in config.js.
--
-- NOTE: written to standard Postgres/Supabase conventions but not yet run against a live project.
-- Test it on a free project before launch (README → "Connecting Supabase").

create table if not exists public.v4_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  participant uuid not null,
  type        text not null check (type in ('visit','sim_start','sim_complete','assessment','lesson_complete','mission_complete','feedback')),
  page        text check (char_length(page) <= 40),
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) < 4000)
);

create index if not exists v4_events_type_idx on public.v4_events (type);
create index if not exists v4_events_participant_idx on public.v4_events (participant);

alter table public.v4_events enable row level security;

drop policy if exists "public can add events" on public.v4_events;
create policy "public can add events" on public.v4_events
  for insert to anon, authenticated
  with check (true);
-- Intentionally NO select/update/delete policies for anon or authenticated.
revoke select, update, delete on public.v4_events from anon, authenticated;

-- Aggregate-only summary for the team impact dashboard.
create or replace function public.v4_impact_summary()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
with
  topics(t) as (values ('college'), ('budgeting'), ('credit'), ('saving'), ('income')),
  visit_days as (
    select participant, count(distinct (created_at at time zone 'UTC')::date) as days
    from v4_events where type = 'visit' group by participant
  ),
  latest as (
    select distinct on (participant, data->>'phase')
      participant, data->>'phase' as phase, data
    from v4_events
    where type = 'assessment'
    order by participant, data->>'phase', created_at desc
  ),
  paired as (
    select p.participant, p.data as pre, q.data as post
    from latest p join latest q on q.participant = p.participant
    where p.phase = 'pre' and q.phase = 'post'
  ),
  frac as (
    select participant,
      (pre->>'score')::numeric / nullif((pre->>'total')::numeric, 0) as pre_f,
      (post->>'score')::numeric / nullif((post->>'total')::numeric, 0) as post_f
    from paired
  ),
  by_topic as (
    select t,
      avg((pre->'byTopic'->t->>'correct')::numeric / nullif((pre->'byTopic'->t->>'total')::numeric, 0)) as pre,
      avg((post->'byTopic'->t->>'correct')::numeric / nullif((post->'byTopic'->t->>'total')::numeric, 0)) as post
    from paired cross join topics group by t
  ),
  retention as (
    select r.participant,
      (r.data->>'score')::numeric / nullif((r.data->>'total')::numeric, 0) as ret_f,
      (p.data->>'score')::numeric / nullif((p.data->>'total')::numeric, 0) as pre_f
    from latest r left join latest p on p.participant = r.participant and p.phase = 'pre'
    where r.phase = 'retention'
  ),
  lessons as (select * from v4_events where type = 'lesson_complete'),
  ratings as (
    select (data->>'rating')::numeric as rating from v4_events
    where type = 'feedback' and (data->>'rating') ~ '^[1-5]$'
  )
select jsonb_build_object(
  'participants',      (select count(distinct participant) from v4_events),
  'returning',         (select count(*) from visit_days where days > 1),
  'simStarts',         (select count(*) from v4_events where type = 'sim_start'),
  'simCompletes',      (select count(*) from v4_events where type = 'sim_complete'),
  'completionRate',    (select case when s = 0 then null else c::numeric / s end
                        from (select count(*) filter (where type = 'sim_start') s,
                                     count(*) filter (where type = 'sim_complete') c from v4_events) x),
  'preCount',          (select count(*) from latest where phase = 'pre'),
  'postCount',         (select count(*) from latest where phase = 'post'),
  'paired', jsonb_build_object(
      'n',        (select count(*) from frac),
      'pre',      (select avg(pre_f) from frac),
      'post',     (select avg(post_f) from frac),
      'improved', (select count(*) from frac where post_f > pre_f),
      'byTopic',  (select coalesce(jsonb_object_agg(t, jsonb_build_object('pre', pre, 'post', post)), '{}'::jsonb) from by_topic)),
  'lessonsCompleted',   (select count(*) from lessons),
  'lessonParticipants', (select count(distinct participant) from lessons),
  'lessonPassRate',     (select avg(case when (data->>'passed')::boolean then 1 else 0 end) from lessons),
  'missionsCompleted',  (select count(*) from v4_events where type = 'mission_complete'),
  'feedback',  jsonb_build_object('n', (select count(*) from ratings), 'avg', (select avg(rating) from ratings)),
  'retention', jsonb_build_object('n', (select count(*) from retention), 'avg', (select avg(ret_f) from retention), 'preAvg', (select avg(pre_f) from retention))
);
$$;

revoke all on function public.v4_impact_summary() from public;
grant execute on function public.v4_impact_summary() to anon, authenticated;
