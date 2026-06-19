import type { Role } from "./types";

/**
 *  - ADMIN:      controle total (ordens, status, usuários).
 *  - SUPERVISOR: criar, editar e apagar ordens de serviço.
 *  - EMPRESA:    visualizar e comentar apenas as OS encaminhadas à sua
 *                prestadora, e alterar o status (ex.: marcar como concluída).
 */

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  EMPRESA: "Empresa",
};

export function canManageOrders(role: Role): boolean {
  return role === "ADMIN" || role === "SUPERVISOR";
}

export function canManageUsers(role: Role): boolean {
  return role === "ADMIN";
}

export function canComment(_role: Role): boolean {
  return true; // todos os perfis autenticados podem comentar
}

export function canChangeStatus(_role: Role): boolean {
  return true; // inclusive EMPRESA pode marcar como concluída
}
