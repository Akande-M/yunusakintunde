-- =====================================================================
-- CMS update 9: editable pages + editable navigation menu.
--   site_pages  : one row per page, built from ordered sections (jsonb)
--   menu_items  : the top navigation tree (3 levels). A link to an unpublished page
--                 opens a "coming soon" page (draft content is never public).
-- Safe to run more than once.
-- =====================================================================

create table if not exists public.site_pages (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique
                 check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
                 check (slug not in ('admin','news','media','biography','achievements','support','get-involved',
                                     'privacy','sitemap','record-agenda','p','api','assets','site-images','hero','brand')),
  title        text not null,
  eyebrow      text not null default '',
  intro        text not null default '',
  hero_image   text,
  hero_alt     text not null default '',
  seo_description text not null default '',
  sections     jsonb not null default '[]'::jsonb,
  status       text not null default 'draft' check (status in ('draft','published')),
  created_by   uuid,
  updated_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_pages TO authenticated;
GRANT ALL ON public.site_pages TO service_role;
GRANT SELECT ON public.site_pages TO anon;

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.menu_items (id) on delete cascade,
  label       text not null,
  href        text,
  page_slug   text,
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_by  uuid,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
GRANT SELECT ON public.menu_items TO anon;

do $$
declare t text;
begin
  foreach t in array array['site_pages','menu_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.touch_audit()', t || '_audit', t);
    execute format('drop policy if exists "staff read all" on public.%I', t);
    execute format('drop policy if exists "staff insert" on public.%I', t);
    execute format('drop policy if exists "staff update" on public.%I', t);
    execute format('drop policy if exists "staff delete" on public.%I', t);
    execute format('create policy "staff read all" on public.%I for select to authenticated using (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using (public.is_staff(auth.uid()))', t);
  end loop;
end $$;

drop policy if exists "public reads published pages" on public.site_pages;
create policy "public reads published pages" on public.site_pages
  for select to anon, authenticated using (status = 'published');

drop policy if exists "public reads visible menu" on public.menu_items;
create policy "public reads visible menu" on public.menu_items
  for select to anon, authenticated using (visible);