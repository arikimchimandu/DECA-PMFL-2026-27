-- Centspire V5 — clear test data before real data collection.
-- ⚠ PERMANENTLY deletes every V5 event (team testing included), plus test reward redemptions.
-- Run ONCE, right before the first real student, and write the date in your project log.
-- Supabase → SQL Editor → New query → paste → Run.
-- (Save codes in v5_saves are left alone so nobody loses saved progress.)

truncate table public.v5_events restart identity;
truncate table public.v5_redemptions;
