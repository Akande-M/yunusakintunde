-- =====================================================================
-- CMS update 10: editable header bar + menu icons.
--   * site_settings key 'header' (top bar, logo text, button) becomes publicly readable.
--   * menu_items.icon: the icon shown beside a link in the drop-down (empty = automatic).
-- Safe to run more than once.
-- =====================================================================
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('contact', 'socials', 'home', 'footer', 'images', 'achievements', 'header'));

alter table public.menu_items add column if not exists icon text;
