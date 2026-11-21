drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings" on public.site_settings
  for select to anon, authenticated
  using (key in ('contact', 'socials', 'home', 'footer', 'images', 'achievements'));

create or replace function public.submit_signup(
  p_full_name text,
  p_email     text,
  p_phone     text,
  p_lga_ward  text,
  p_intent    text,
  p_message   text default null,
  p_consent   boolean default false,
  p_source    text default 'website'
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_consent is not true then raise exception 'Please agree to be contacted.'; end if;
  if length(trim(coalesce(p_full_name, ''))) < 2 or length(p_full_name) > 120 then raise exception 'Please enter your full name.'; end if;
  if coalesce(p_email, '') !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(p_email) > 200 then raise exception 'Please enter a valid email.'; end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 7 or length(p_phone) > 40 then raise exception 'Please enter a valid phone number.'; end if;
  if length(trim(coalesce(p_lga_ward, ''))) < 2 or length(p_lga_ward) > 160 then raise exception 'Please enter your LGA / ward.'; end if;
  if length(coalesce(p_intent, '')) > 120 or length(coalesce(p_message, '')) > 2000 then raise exception 'Your message is too long.'; end if;

  insert into public.signups (full_name, email, phone, lga_ward, intent, message, consent, source)
  values (trim(p_full_name), lower(trim(p_email)), trim(p_phone), trim(p_lga_ward), coalesce(p_intent, ''),
          nullif(trim(coalesce(p_message, '')), ''), true, left(coalesce(p_source, 'website'), 60));
end $$;
revoke all on function public.submit_signup(text, text, text, text, text, text, boolean, text) from public;
grant execute on function public.submit_signup(text, text, text, text, text, text, boolean, text) to anon, authenticated;

create or replace function public.claim_first_admin(p_code text, p_full_name text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then raise exception 'Sign in first.'; end if;
  perform pg_advisory_xact_lock(hashtext('claim_first_admin'));
  if exists (select 1 from public.user_roles where role = 'admin') then
    raise exception 'Setup is already complete. Ask an existing admin to invite you.';
  end if;
  -- SHA-256 of the private setup code (the code itself is never stored).
  if encode(sha256(convert_to(upper(trim(coalesce(p_code, ''))), 'UTF8')), 'hex')
     <> 'ffac0e8103d79a72c099c61557f3c5a6bc2ee3f48726697250d4786e013638dc' then
    raise exception 'That setup code is not valid.';
  end if;
  select email into v_email from auth.users where id = v_uid;
  insert into public.user_roles (user_id, email, full_name, role)
  values (v_uid, v_email, left(trim(coalesce(p_full_name, '')), 100), 'admin');
  return true;
end $$;
revoke all on function public.claim_first_admin(text, text) from public;
grant execute on function public.claim_first_admin(text, text) to authenticated;

create table if not exists public.staff_invites (
  id           uuid primary key default gen_random_uuid(),
  email        text not null unique check (email = lower(email)),
  full_name    text not null default '',
  role         public.app_role not null default 'editor',
  invited_by   uuid,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,
  accepted_by  uuid
);
grant select, insert, update, delete on public.staff_invites to authenticated;
grant all on public.staff_invites to service_role;
alter table public.staff_invites enable row level security;
drop policy if exists "admins manage invites" on public.staff_invites;
create policy "admins manage invites" on public.staff_invites
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.accept_staff_invite()
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text;
  v_invite public.staff_invites%rowtype;
begin
  if v_uid is null then return null; end if;
  select lower(email) into v_email from auth.users where id = v_uid and email_confirmed_at is not null;
  if v_email is null then return null; end if;
  select * into v_invite from public.staff_invites where email = v_email and accepted_at is null;
  if not found then return null; end if;

  insert into public.user_roles (user_id, email, full_name, role)
  values (v_uid, v_email, v_invite.full_name, v_invite.role)
  on conflict (user_id) do update set role = excluded.role, full_name = excluded.full_name;
  update public.staff_invites set accepted_at = now(), accepted_by = v_uid where id = v_invite.id;
  return v_invite.role::text;
end $$;
revoke all on function public.accept_staff_invite() from public;
grant execute on function public.accept_staff_invite() to authenticated;

create or replace function public.list_staff()
returns table (user_id uuid, email text, full_name text, role public.app_role, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Only admins can manage the team.'; end if;
  return query
    select r.user_id, coalesce(r.email, u.email)::text, r.full_name, r.role, r.created_at, u.last_sign_in_at
      from public.user_roles r
      left join auth.users u on u.id = r.user_id
     order by r.created_at;
end $$;
revoke all on function public.list_staff() from public;
grant execute on function public.list_staff() to authenticated;

create or replace function public.set_staff_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Only admins can manage the team.'; end if;
  perform pg_advisory_xact_lock(hashtext('staff_admins'));
  if p_role = 'editor'
     and exists (select 1 from public.user_roles where user_id = p_user_id and role = 'admin')
     and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'You can''t remove the last admin.';
  end if;
  update public.user_roles set role = p_role where user_id = p_user_id;
end $$;
revoke all on function public.set_staff_role(uuid, public.app_role) from public;
grant execute on function public.set_staff_role(uuid, public.app_role) to authenticated;

create or replace function public.remove_staff(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Only admins can manage the team.'; end if;
  if p_user_id = auth.uid() then raise exception 'You can''t remove yourself.'; end if;
  perform pg_advisory_xact_lock(hashtext('staff_admins'));
  if exists (select 1 from public.user_roles where user_id = p_user_id and role = 'admin')
     and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'You can''t remove the last admin.';
  end if;
  delete from public.user_roles where user_id = p_user_id;
  delete from public.staff_invites where accepted_by = p_user_id;
end $$;
revoke all on function public.remove_staff(uuid) from public;
grant execute on function public.remove_staff(uuid) to authenticated;