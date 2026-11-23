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
  created_by   uuid references auth.users (id) on delete set null,
  updated_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.menu_items (id) on delete cascade,
  label       text not null,
  href        text,            -- a built-in page or address, e.g. /news
  page_slug   text,            -- or a CMS page (site_pages.slug)
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

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

-- ---------- Seed pages (only when empty) ----------------------------------
-- Published: pages built from content the site already has.
-- Draft: outlines for the team to fill in; they stay out of the menu until published.
insert into public.site_pages (slug, title, eyebrow, intro, hero_image, hero_alt, seo_description, sections, status)
select * from (values
  ('bills-and-motions', 'Bills & Motions', 'Legislative business',
   'The bills Senator Yunus Abiodun Akintunde, PhD has sponsored and the motions he has moved in the 10th Senate.',
   '/site-images/senate.jpg', 'The Nigerian Senate chamber',
   'Bills sponsored and motions moved by Senator Yunus Abiodun Akintunde, PhD, Oyo Central.',
   '[{"type":"legislative","heading":"","intro":""}]'::jsonb, 'published'),

  ('committees-and-oversight', 'Committees & Oversight', 'Legislative work',
   '[One or two sentences on the Senator''s committee work and oversight role.]',
   null, '', '',
   '[{"type":"text","heading":"Committee memberships","body":"[List each Senate standing committee, the Senator''s role on it, and since when.]","image":"","caption":"","imageSide":"right"},
     {"type":"cards","heading":"Oversight visits","intro":"[Agencies, projects or institutions visited, with a photo of each.]","items":[]}]'::jsonb, 'draft'),

  ('outreach', 'Outreach', 'Constituency interventions',
   'Free medical outreaches, health checks and community programmes across Oyo Central.',
   '/site-images/medical.jpg', 'A medical outreach in Oyo Central',
   'Medical outreaches and community programmes delivered by Senator Yunus Abiodun Akintunde, PhD.',
   '[{"type":"topic","topic":"outreach","heading":"Outreach in every local government","intro":""}]'::jsonb, 'published'),

  ('infrastructure-projects', 'Infrastructure Projects', 'Constituency interventions',
   'Roads, solar streetlights, boreholes, classrooms and other projects delivered across Oyo Central.',
   '/site-images/solar-night.jpg', 'Solar-powered streetlights at night',
   'Infrastructure projects delivered by Senator Yunus Abiodun Akintunde, PhD across Oyo Central.',
   '[{"type":"projects","heading":"Delivered projects","intro":""},{"type":"topic","topic":"infrastructure","heading":"Infrastructure by local government","intro":""}]'::jsonb, 'published'),

  ('skills-jobs-and-empowerment', 'Skills, Jobs & Empowerment', 'Constituency interventions',
   'Skills training, equipment, grants and scholarships that put people in Oyo Central to work.',
   '/site-images/skills.jpg', 'A skills acquisition session',
   'Skills training and empowerment programmes by Senator Yunus Abiodun Akintunde, PhD.',
   '[{"type":"topic","topic":"empowerment","heading":"Empowerment by local government","intro":""}]'::jsonb, 'published'),

  ('recognition', 'Recognition', 'About',
   '[One or two sentences introducing the awards and honours the Senator has received.]',
   null, '', '',
   '[{"type":"cards","heading":"Awards & honours","intro":"","items":[{"title":"[Award name, year]","text":"[Who gave it and why.]","image":""}]}]'::jsonb, 'draft'),

  ('campaigns-and-mobilisation', 'Campaigns & Mobilisation', 'Political & party leadership',
   '[Introduce the campaign and grassroots mobilisation work.]',
   null, '', '',
   '[{"type":"text","heading":"[Section heading]","body":"[Text]","image":"","caption":"","imageSide":"right"},{"type":"gallery","heading":"On the campaign trail","images":[]}]'::jsonb, 'draft'),

  ('constituency-engagements', 'Constituency Engagements', 'Political & party leadership',
   '[Introduce town halls, ward meetings and visits across the constituency.]',
   '/site-images/townhall.jpg', 'A town hall meeting', '',
   '[{"type":"cards","heading":"Recent engagements","intro":"","items":[{"title":"[Engagement, place, date]","text":"[What was discussed or agreed.]","image":""}]}]'::jsonb, 'draft'),

  ('stakeholder-engagements', 'Stakeholder Engagements', 'Political & party leadership',
   '[Introduce meetings with traditional rulers, party leaders, groups and associations.]',
   null, '', '',
   '[{"type":"cards","heading":"Engagements","intro":"","items":[{"title":"[Stakeholder, date]","text":"[Purpose and outcome.]","image":""}]}]'::jsonb, 'draft')
) v (slug, title, eyebrow, intro, hero_image, hero_alt, seo_description, sections, status)
where not exists (select 1 from public.site_pages);

-- ---------- Seed menu (only when empty) -----------------------------------
do $$
declare
  about uuid; leg uuid; ci uuid; pol uuid; nm uuid;
begin
  if exists (select 1 from public.menu_items) then return; end if;

  insert into public.menu_items (label, href, sort_order) values ('Home', '/', 10);

  insert into public.menu_items (label, sort_order) values ('About', 20) returning id into about;
  insert into public.menu_items (parent_id, label, href, sort_order) values
    (about, 'Biography', '/biography', 10),
    (about, 'Achievements', '/achievements', 20);
  insert into public.menu_items (parent_id, label, page_slug, sort_order) values (about, 'Recognition', 'recognition', 30);

  insert into public.menu_items (label, sort_order) values ('Legislative Work', 30) returning id into leg;
  insert into public.menu_items (parent_id, label, page_slug, sort_order) values
    (leg, 'Bills & Motions', 'bills-and-motions', 10),
    (leg, 'Committees & Oversight', 'committees-and-oversight', 20);
  insert into public.menu_items (parent_id, label, sort_order)
    values (leg, 'Constituency Interventions & Development Projects', 30) returning id into ci;
  insert into public.menu_items (parent_id, label, page_slug, sort_order) values
    (ci, 'Outreach', 'outreach', 10),
    (ci, 'Infrastructure Projects', 'infrastructure-projects', 20),
    (ci, 'Skills, Jobs & Empowerment', 'skills-jobs-and-empowerment', 30);

  insert into public.menu_items (label, sort_order) values ('Political & Party Leadership', 40) returning id into pol;
  insert into public.menu_items (parent_id, label, page_slug, sort_order) values
    (pol, 'Campaigns & Mobilisation', 'campaigns-and-mobilisation', 10),
    (pol, 'Constituency Engagements', 'constituency-engagements', 20),
    (pol, 'Stakeholder Engagements', 'stakeholder-engagements', 30);

  insert into public.menu_items (label, sort_order) values ('News & Media', 50) returning id into nm;
  insert into public.menu_items (parent_id, label, href, sort_order) values
    (nm, 'News & Updates', '/news', 10),
    (nm, 'Media Gallery', '/media', 20);
end $$;
