-- =====================================================================
-- CMS update 2: editable site images + footer, and dash-free copy.
-- Safe to run more than once.
-- =====================================================================

-- 1. Let visitors read the two new public settings groups.
--    (Replaces the narrower policy from 0001_tighten_settings_and_media_reads.)
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('contact', 'socials', 'home', 'footer', 'images'));

-- 2. Copy clean-up: remove long dashes from the seeded content.
--    Exact matches only, so anything an editor has already rewritten is untouched.
update public.endorsements
   set quote = 'A senator who delivers and reports back. That is the standard every representative should be held to.'
 where quote = 'A senator who delivers and reports back — that is the standard every representative should be held to.';

update public.endorsements
   set quote = replace(quote, 'accessible and effective — the skills centre', 'accessible and effective. The skills centre')
 where quote like 'Senator Akintunde has been accessible and effective — the skills centre%';

update public.site_settings
   set value = jsonb_set(value, '{heroBody}', to_jsonb(replace(value->>'heroBody', 'Senatorial District — asking', 'Senatorial District, asking')))
 where key = 'home' and value->>'heroBody' like '%Senatorial District — asking%';

update public.site_settings
   set value = jsonb_set(value, '{quote}', to_jsonb(replace(value->>'quote', 'a record — and a plan', 'a record, and a plan')))
 where key = 'home' and value->>'quote' like '%a record — and a plan%';

update public.site_settings
   set value = jsonb_set(value, '{campaignVideoCaption}', to_jsonb(replace(value->>'campaignVideoCaption', '” — Akintunde 2027.', '”, Akintunde 2027.')))
 where key = 'home' and value->>'campaignVideoCaption' like '%” — Akintunde 2027.%';
