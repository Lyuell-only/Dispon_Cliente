-- ============================================================================
--  Painel de Disponibilidade — schema do Supabase
--  Rode este arquivo no SQL Editor do Supabase (uma vez).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Tabelas
-- ----------------------------------------------------------------------------

-- Perfil do usuário (estende auth.users). O "role" define a permissão e, para
-- usuários EMPRESA, "prestadora_id" referencia o id de uma prestadora do
-- arquivo de configuração (src/config/prestadoras.ts).
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null,
  role          text not null default 'EMPRESA'
                check (role in ('ADMIN', 'SUPERVISOR', 'EMPRESA')),
  prestadora_id text,
  created_at    timestamptz not null default now()
);

-- Ordens de serviço. O cliente NÃO é cadastrado: guardamos apenas o código e o
-- nome digitados no momento da OS (formato "(231232) CLIENTE TALTALTAL").
create table if not exists public.service_orders (
  id             uuid primary key default gen_random_uuid(),
  client_code    text,
  client_name    text not null,
  tipo           text not null,
  cidade         text not null,
  prestadora_id  text,
  observacao     text,
  status         text not null default 'ABERTA'
                 check (status in ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
  opened_at      date not null default current_date,
  availability_at date,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists service_orders_prestadora_idx on public.service_orders (prestadora_id);
create index if not exists service_orders_status_idx on public.service_orders (status);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.service_orders (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_order_idx on public.comments (order_id);

-- ----------------------------------------------------------------------------
--  Funções auxiliares (SECURITY DEFINER evita recursão de RLS na tabela profiles)
-- ----------------------------------------------------------------------------

create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_prestadora()
returns text language sql stable security definer set search_path = public as $$
  select prestadora_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN');
$$;

-- Cria automaticamente o perfil quando um usuário é criado no Auth.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    'EMPRESA'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Altera o status de uma OS respeitando a permissão do usuário.
-- EMPRESA só altera OS encaminhadas à sua prestadora (ex.: marcar concluída).
create or replace function public.set_order_status(p_order uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_prest text;
begin
  if p_status not in ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') then
    raise exception 'Status inválido';
  end if;

  select role, prestadora_id into v_role, v_prest from public.profiles where id = auth.uid();

  if v_role is null then
    raise exception 'Não autenticado';
  elsif v_role in ('ADMIN', 'SUPERVISOR') then
    update public.service_orders set status = p_status, updated_at = now() where id = p_order;
  elsif v_role = 'EMPRESA' then
    update public.service_orders
      set status = p_status, updated_at = now()
      where id = p_order and prestadora_id = v_prest;
    if not found then
      raise exception 'Sem permissão para esta ordem';
    end if;
  else
    raise exception 'Sem permissão';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
--  Row Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.service_orders enable row level security;
alter table public.comments enable row level security;

-- profiles -------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.uid() is not null);

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- service_orders -------------------------------------------------------------
drop policy if exists orders_select on public.service_orders;
create policy orders_select on public.service_orders
  for select using (
    public.my_role() in ('ADMIN', 'SUPERVISOR')
    or (public.my_role() = 'EMPRESA' and prestadora_id is not distinct from public.my_prestadora())
  );

drop policy if exists orders_insert on public.service_orders;
create policy orders_insert on public.service_orders
  for insert with check (public.my_role() in ('ADMIN', 'SUPERVISOR'));

drop policy if exists orders_update on public.service_orders;
create policy orders_update on public.service_orders
  for update using (public.my_role() in ('ADMIN', 'SUPERVISOR'));

drop policy if exists orders_delete on public.service_orders;
create policy orders_delete on public.service_orders
  for delete using (public.my_role() in ('ADMIN', 'SUPERVISOR'));

-- comments -------------------------------------------------------------------
drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments
  for select using (
    public.my_role() in ('ADMIN', 'SUPERVISOR')
    or exists (
      select 1 from public.service_orders o
      where o.id = comments.order_id
        and o.prestadora_id is not distinct from public.my_prestadora()
    )
  );

drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments
  for insert with check (
    author_id = auth.uid()
    and (
      public.my_role() in ('ADMIN', 'SUPERVISOR')
      or exists (
        select 1 from public.service_orders o
        where o.id = comments.order_id
          and o.prestadora_id is not distinct from public.my_prestadora()
      )
    )
  );

-- ----------------------------------------------------------------------------
--  Primeiro administrador
--  Depois de criar seu usuário (via tela de login do app ou Authentication >
--  Users no Supabase), rode o comando abaixo trocando o e-mail:
--
--    update public.profiles set role = 'ADMIN'
--    where id = (select id from auth.users where email = 'voce@exemplo.com');
-- ----------------------------------------------------------------------------
