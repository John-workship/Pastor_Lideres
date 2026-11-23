-- IPUC Líderes · Directorio e invitaciones de líderes para 2026
-- Este archivo documenta el SQL aplicado al proyecto Supabase ctgrfytplwtilorayuyn.
-- RLS: solo pastor y secretario pueden administrar el directorio y las convocatorias.

create table if not exists public.leader_directory (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email text not null,
  phone text,
  committee text,
  period_year integer not null default 2026 check (period_year between 2026 and 2035),
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists leader_directory_email_year_uidx
  on public.leader_directory (lower(email), period_year);

create table if not exists public.leader_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 2 and 160),
  period_year integer not null default 2026 check (period_year between 2026 and 2035),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.leader_invitations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.leader_directory(id) on delete restrict,
  campaign_id uuid references public.leader_campaigns(id) on delete set null,
  email text not null,
  token_hash text not null unique,
  status text not null default 'generated'
    check (status in ('generated','accepted','expired','revoked')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  accepted_user_id uuid references auth.users(id),
  accepted_at timestamptz
);
create index if not exists leader_invitations_status_idx
  on public.leader_invitations(status, expires_at);
create index if not exists leader_invitations_email_idx
  on public.leader_invitations(lower(email));

alter table public.leader_directory enable row level security;
alter table public.leader_campaigns enable row level security;
alter table public.leader_invitations enable row level security;

drop policy if exists leader_directory_admin_all on public.leader_directory;
create policy leader_directory_admin_all on public.leader_directory
  for all to authenticated
  using (private.has_any_role(array['pastor','secretario']))
  with check (private.has_any_role(array['pastor','secretario']));

drop policy if exists leader_campaigns_admin_all on public.leader_campaigns;
create policy leader_campaigns_admin_all on public.leader_campaigns
  for all to authenticated
  using (private.has_any_role(array['pastor','secretario']))
  with check (private.has_any_role(array['pastor','secretario']));

drop policy if exists leader_invitations_admin_select on public.leader_invitations;
create policy leader_invitations_admin_select on public.leader_invitations
  for select to authenticated
  using (private.has_any_role(array['pastor','secretario']));

create or replace function public.create_leader_invitation(
  p_person_id uuid, p_campaign_id uuid default null
)
returns table(invitation_id uuid, invitation_token text, invite_email text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_person public.leader_directory%rowtype;
  v_token text;
  v_id uuid;
  v_expires timestamptz;
begin
  if auth.uid() is null or not private.has_any_role(array['pastor','secretario']) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select * into v_person from public.leader_directory
    where id=p_person_id and active=true;
  if not found then raise exception 'Leader not found or inactive'; end if;
  if p_campaign_id is not null and not exists (
    select 1 from public.leader_campaigns c
    where c.id=p_campaign_id and c.period_year=v_person.period_year
  ) then raise exception 'Campaign does not match leader period'; end if;

  update public.leader_invitations set status='revoked'
    where person_id=v_person.id and status='generated';
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  v_expires := now() + interval '7 days';
  insert into public.leader_invitations
    (person_id,campaign_id,email,token_hash,status,expires_at,created_by)
  values
    (v_person.id,p_campaign_id,lower(trim(v_person.email)),md5(v_token),'generated',v_expires,auth.uid())
  returning id into v_id;
  return query select v_id,v_token,lower(trim(v_person.email)),v_expires;
end;
$$;
revoke all on function public.create_leader_invitation(uuid,uuid) from public,anon;
grant execute on function public.create_leader_invitation(uuid,uuid) to authenticated;

create or replace function public.redeem_leader_invitation(
  p_token text, p_user_id uuid, p_email text, p_full_name text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_invitation public.leader_invitations%rowtype;
begin
  if auth.uid() is null or auth.uid()<>p_user_id
     or lower(coalesce(auth.jwt()->>'email',''))<>lower(trim(coalesce(p_email,''))) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  select * into v_invitation from public.leader_invitations
    where token_hash=md5(p_token) and lower(email)=lower(trim(p_email))
    for update;
  if not found then raise exception 'Invitation not found'; end if;
  if v_invitation.status='accepted' and v_invitation.accepted_user_id=p_user_id then
    return;
  end if;
  if v_invitation.status<>'generated' or v_invitation.expires_at<=now() then
    raise exception 'Invitation is invalid, expired, or already used';
  end if;
  update public.profiles
    set role='lideres',
        display_name=coalesce(nullif(trim(p_full_name),''),display_name),
        must_change_password=false,
        updated_at=now()
    where id=p_user_id;
  if not found then raise exception 'User profile not found'; end if;
  update public.leader_invitations
    set status='accepted',accepted_user_id=p_user_id,accepted_at=now()
    where id=v_invitation.id;
end;
$$;
revoke all on function public.redeem_leader_invitation(text,uuid,text,text) from public,anon;
grant execute on function public.redeem_leader_invitation(text,uuid,text,text) to authenticated;

-- El usuario solo puede completar su propio cambio inicial de contraseña.
create or replace function public.complete_password_setup()
returns void language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles set must_change_password=false,updated_at=now()
    where id=auth.uid();
  if not found then raise exception 'Profile not found'; end if;
end;
$$;
revoke all on function public.complete_password_setup() from public,anon;
grant execute on function public.complete_password_setup() to authenticated;
grant update (must_change_password,updated_at) on public.profiles to authenticated;
drop policy if exists profiles_update_own_password_setup on public.profiles;
create policy profiles_update_own_password_setup on public.profiles
  for update to authenticated
  using ((select auth.uid())=id)
  with check ((select auth.uid())=id);

revoke all on public.leader_directory,public.leader_campaigns,public.leader_invitations from anon;
grant select,insert,update,delete on public.leader_directory,public.leader_campaigns to authenticated;
grant select on public.leader_invitations to authenticated;
