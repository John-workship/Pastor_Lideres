-- IPUC Líderes: Amanecer con Fe y administración segura de accesos
-- Esta migración ya fue aplicada al proyecto Supabase de producción.
-- Puede ejecutarse de nuevo de forma segura para recrear las políticas y funciones.

create table if not exists public.community_links (
  id text primary key,
  title text not null,
  description text not null default '',
  url text not null,
  active boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint community_links_url_https check (url ~ '^https://')
);

alter table public.community_links enable row level security;

drop policy if exists community_links_public_read on public.community_links;
create policy community_links_public_read on public.community_links
  for select to anon, authenticated using (true);

drop policy if exists community_links_pastor_insert on public.community_links;
create policy community_links_pastor_insert on public.community_links
  for insert to authenticated
  with check (private.has_any_role(array['pastor']::text[]));

drop policy if exists community_links_pastor_update on public.community_links;
create policy community_links_pastor_update on public.community_links
  for update to authenticated
  using (private.has_any_role(array['pastor']::text[]))
  with check (private.has_any_role(array['pastor']::text[]));

grant select on public.community_links to anon, authenticated;
grant insert, update on public.community_links to authenticated;

insert into public.community_links (id, title, description, url, active)
values (
  'amanecer_con_fe',
  'Amanecer con Fe',
  'Encuentro diario de oración. Conéctate y comparte este tiempo con la iglesia.',
  'https://meet.google.com/suz-kcxq-oip',
  true
)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  url = excluded.url,
  active = true,
  updated_at = now();

create or replace function public.admin_list_user_access()
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text,
  must_change_password boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'pastor'
  ) then
    raise exception 'No autorizado: solo el Pastor puede gestionar accesos.';
  end if;

  return query
  select u.id, u.email::text, coalesce(p.display_name, ''), p.role,
         p.must_change_password, p.created_at
  from auth.users u
  join public.profiles p on p.id = u.id
  order by case when p.role = 'pastor' then 0 else 1 end, p.created_at asc;
end;
$$;

create or replace function public.admin_update_user_access(
  p_user_id uuid,
  p_display_name text,
  p_role text,
  p_must_change_password boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_role text;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'pastor'
  ) then
    raise exception 'No autorizado: solo el Pastor puede gestionar accesos.';
  end if;

  if p_user_id is null or p_user_id = auth.uid() then
    raise exception 'No puedes modificar tu propio acceso desde este módulo.';
  end if;

  if p_role not in ('secretario', 'tesorero', 'lideres') then
    raise exception 'Rol no permitido.';
  end if;

  select p.role into v_target_role
  from public.profiles p
  where p.id = p_user_id;

  if v_target_role is null then
    raise exception 'No se encontró el perfil solicitado.';
  end if;

  if v_target_role = 'pastor' then
    raise exception 'La cuenta de Pastor está protegida.';
  end if;

  update public.profiles
  set display_name = nullif(left(trim(coalesce(p_display_name, '')), 120), ''),
      role = p_role,
      must_change_password = coalesce(p_must_change_password, false),
      updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.admin_list_user_access() from public, anon;
grant execute on function public.admin_list_user_access() to authenticated;

revoke all on function public.admin_update_user_access(uuid, text, text, boolean) from public, anon;
grant execute on function public.admin_update_user_access(uuid, text, text, boolean) to authenticated;
