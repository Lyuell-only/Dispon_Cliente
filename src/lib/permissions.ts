import type { Role } from "@prisma/client";

/**
 * Regras de permissão do painel.
 *
 *  - ADMIN:      controle total sobre qualquer demanda (usuários, clientes, ordens).
 *  - SUPERVISOR: pode criar, editar e apagar ordens de serviço e clientes.
 *  - EMPRESA:    apenas visualizar e comentar nas ordens do próprio cliente,
 *                além de marcar como concluída.
 */

export type AppRole = Role;

export const ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  EMPRESA: "Empresa",
};

/** Pode gerenciar (criar/editar/excluir) clientes. */
export function canManageClients(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

/** Pode criar/editar/excluir ordens de serviço. */
export function canManageOrders(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

/** Pode gerenciar usuários do sistema. */
export function canManageUsers(role: AppRole): boolean {
  return role === "ADMIN";
}

/** Pode comentar nas ordens de serviço. */
export function canComment(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR" || role === "EMPRESA";
}

/** Pode alterar o status da ordem (ex.: marcar como concluída). */
export function canChangeStatus(role: AppRole): boolean {
  return role === "ADMIN" || role === "SUPERVISOR" || role === "EMPRESA";
}

/**
 * Usuários EMPRESA só enxergam as ordens do cliente ao qual estão vinculados.
 * Retorna o filtro `where` que deve ser aplicado às consultas de ordens.
 */
export function ordersScopeFilter(user: {
  role: AppRole;
  clientId?: string | null;
}): { clientId?: string } {
  if (user.role === "EMPRESA") {
    // Se a empresa não estiver vinculada a um cliente, não vê nada.
    return { clientId: user.clientId ?? "__none__" };
  }
  return {};
}
