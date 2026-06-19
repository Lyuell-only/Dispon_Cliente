-- ============================================================================
--  Migração: novos status de ordem de serviço
--
--  Rode este arquivo no SQL Editor do Supabase UMA VEZ, caso você já tenha
--  criado as tabelas com a versão anterior do schema. Se você ainda não rodou
--  o schema.sql, ignore este arquivo — o schema.sql já está atualizado.
--
--  Status antigos -> novos:
--    ABERTA        -> AGUARDANDO
--    EM_ANDAMENTO  -> PENDENTE
--    CANCELADA     -> NAO_REALIZADA
--    CONCLUIDA     -> CONCLUIDA (mantém)
-- ============================================================================

-- 1) Remove a restrição antiga de valores
alter table public.service_orders drop constraint if exists service_orders_status_check;

-- 2) Converte os registros existentes
update public.service_orders set status = 'AGUARDANDO'    where status = 'ABERTA';
update public.service_orders set status = 'PENDENTE'      where status = 'EM_ANDAMENTO';
update public.service_orders set status = 'NAO_REALIZADA' where status = 'CANCELADA';

-- 3) Novo default e nova restrição
alter table public.service_orders alter column status set default 'AGUARDANDO';
alter table public.service_orders
  add constraint service_orders_status_check
  check (status in ('AGUARDANDO', 'PENDENTE', 'NAO_REALIZADA', 'CONCLUIDA', 'CONCLUIDA_ATRASO'));

-- 4) Atualiza a função de troca de status
create or replace function public.set_order_status(p_order uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_role text;
  v_prest text;
begin
  if p_status not in ('AGUARDANDO', 'PENDENTE', 'NAO_REALIZADA', 'CONCLUIDA', 'CONCLUIDA_ATRASO') then
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
