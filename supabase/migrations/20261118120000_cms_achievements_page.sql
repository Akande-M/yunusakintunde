-- =====================================================================
-- CMS update 5: settings for the achievements page ("Let's do more" portrait,
-- page heading and intro). Lets visitors read the new 'achievements' settings key.
-- Achievement photos live inside achievement_cards.items as {text, image}; no schema change.
-- Safe to run more than once.
-- =====================================================================
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('contact', 'socials', 'home', 'footer', 'images', 'achievements'));
