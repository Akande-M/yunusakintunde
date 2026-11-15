-- =====================================================================
-- Akintunde 2027 CMS — schema, roles, row-level security, media storage
-- Public site: reads published rows only (no login anywhere public).
-- /admin: staff (admin | editor) read & write everything; both can publish.
-- Team management (add/remove/reset staff) is admin-only and runs through
-- server functions with the service role, never from the browser.
-- =====================================================================

-- ---------- Roles ----------------------------------------------------
create type public.app_role as enum ('admin', 'editor');

create table public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        public.app_role not null,
  created_at  timestamptz not null default now(),
  unique (user_id)
);
alter table public.user_roles enable row level security;

-- SECURITY DEFINER helpers avoid recursive RLS lookups on user_roles.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id)
$$;

create or replace function public.admin_exists()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where role = 'admin')
$$;
grant execute on function public.admin_exists() to anon, authenticated;

create policy "staff read own role, admins read all" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
-- No insert/update/delete policies: role changes go through admin-only server functions.

-- ---------- Shared audit trigger --------------------------------------
create or replace function public.touch_audit()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if auth.uid() is not null then new.updated_by := auth.uid(); end if;
  if tg_op = 'INSERT' and new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end $$;

-- ---------- News -----------------------------------------------------
create table public.news_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  summary         text not null default '',
  category        text not null default 'Constituency'
                    check (category in ('Senate floor','Constituency','2027 Campaign trail','Media coverage')),
  body            text not null default '',          -- paragraphs separated by a blank line
  hero_image_url  text,
  hero_alt        text not null default '',
  photos          jsonb not null default '[]'::jsonb, -- [{url, alt, caption}]
  status          text not null default 'draft' check (status in ('draft','published')),
  published_at    timestamptz not null default now(), -- also the date shown on the site
  created_by      uuid references auth.users (id) on delete set null,
  updated_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index news_posts_feed_idx on public.news_posts (status, published_at desc);

-- ---------- Media gallery ---------------------------------------------
create table public.gallery_items (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'image' check (kind in ('image','youtube','video')),
  url            text not null,           -- image URL, uploaded video URL, or YouTube link
  thumbnail_url  text,                    -- optional poster for uploaded videos
  alt            text not null default '',
  caption        text not null default '',
  category       text not null default 'In Office'
                   check (category in ('In Office','2027 Campaign Trail','Projects','Videos','2023 Archive')),
  archived       boolean not null default false,
  published      boolean not null default true,
  sort_order     integer not null default 0,
  created_by     uuid references auth.users (id) on delete set null,
  updated_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- Record: projects & commitments ----------------------------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  place            text not null default '',
  region           text not null default 'Others' check (region in ('Ibadan','Oyo','Ogbomoso','Others')),
  completed_label  text not null default '',
  image_url        text,
  alt              text not null default '',
  night            boolean not null default false,
  published        boolean not null default true,
  sort_order       integer not null default 0,
  created_by       uuid references auth.users (id) on delete set null,
  updated_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.commitments (
  id            uuid primary key default gen_random_uuid(),
  list          text not null check (list in ('kept','agenda')), -- kept = 2023 promises, agenda = 2027 agenda
  title         text not null,
  detail        text not null default '',
  status        text not null default 'upcoming' check (status in ('delivered','progress','upcoming')),
  status_label  text,
  published     boolean not null default true,
  sort_order    integer not null default 0,
  created_by    uuid references auth.users (id) on delete set null,
  updated_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Endorsements ----------------------------------------------
create table public.endorsements (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  name        text not null,
  role        text not null default '',
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Site settings (key -> JSON) -------------------------------
create table public.site_settings (
  key         text primary key,           -- 'contact' | 'socials' | 'home'
  value       jsonb not null default '{}'::jsonb,
  created_by  uuid references auth.users (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Supporter sign-ups (the site's north-star metric) ---------
create table public.signups (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       text not null,
  phone       text not null,
  lga_ward    text not null,
  intent      text not null,
  message     text,
  consent     boolean not null default true,
  source      text not null default 'website',
  handled     boolean not null default false,
  handled_by  uuid references auth.users (id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index signups_created_idx on public.signups (created_at desc);
alter table public.signups enable row level security;
create policy "staff read signups"   on public.signups for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update signups" on public.signups for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "admins delete signups" on public.signups for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
-- Inserts come only from the server function (service role). No public insert policy on purpose.

-- ---------- RLS + audit for content tables ----------------------------
do $$
declare t text;
begin
  foreach t in array array['news_posts','gallery_items','projects','commitments','endorsements','site_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.touch_audit()', t || '_audit', t);
    execute format('create policy "staff read all" on public.%I for select to authenticated using (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using (public.is_staff(auth.uid()))', t);
  end loop;
end $$;

create policy "public reads published news" on public.news_posts
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "public reads published gallery" on public.gallery_items
  for select to anon, authenticated using (published);
create policy "public reads published projects" on public.projects
  for select to anon, authenticated using (published);
create policy "public reads published commitments" on public.commitments
  for select to anon, authenticated using (published);
create policy "public reads published endorsements" on public.endorsements
  for select to anon, authenticated using (published);
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated using (true);

-- ---------- Media storage bucket --------------------------------------
-- 50 MB per file: fine for photos and short clips. Long videos belong on YouTube.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','image/avif',
              'video/mp4','video/webm','video/quicktime'])
on conflict (id) do nothing;

create policy "public read media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
create policy "staff upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "staff update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));
create policy "staff delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_staff(auth.uid()));
