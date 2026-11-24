-- =====================================================================
-- CMS update 13: the public site can read every site setting, except private ones.
-- New kinds of settings (like 'header' or 'biography' before) no longer need a database
-- change to show on the website. Private keys stay hidden:
--   * 'content_updates' (the log of applied content updates)
--   * any key starting with 'private_'
-- Staff access is unchanged. Safe to run more than once.
-- =====================================================================
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated
  using (key <> 'content_updates' and key not like 'private\_%');