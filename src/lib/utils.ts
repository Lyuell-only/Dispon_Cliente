import type { OrderStatus, ServiceOrder, Role } from "./types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  AGUARDANDO: "Aguardando disponibilidade",
  PENDENTE: "Pendente",
  NAO_REALIZADA: "Não realizada",
  CONCLUIDA: "Concluída",
  CONCLUIDA_ATRASO: "Concluída após dispo",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  AGUARDANDO: "bg-blue-100 text-blue-700",
  PENDENTE: "bg-amber-100 text-amber-700",
  NAO_REALIZADA: "bg-red-100 text-red-700",
  CONCLUIDA: "bg-green-100 text-green-700",
  CONCLUIDA_ATRASO: "bg-emerald-100 text-emerald-700",
};

/** Status "ativos" (ordens em aberto que ainda precisam de ação). */
export const ACTIVE_STATUSES: OrderStatus[] = [
  "AGUARDANDO",
  "PENDENTE",
  "NAO_REALIZADA",
];

/** Status de conclusão (vão para o histórico). */
export const CONCLUDED_STATUSES: OrderStatus[] = [
  "CONCLUIDA",
  "CONCLUIDA_ATRASO",
];

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date.length <= 10 ? `${date}T00:00:00` : date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Lê o campo de cliente no formato "(231232) CLIENTE TALTALTAL" e separa
 * código e nome. Se não casar o formato, devolve tudo como nome.
 */
export function parseCliente(input: string): {
  code: string | null;
  name: string;
} {
  const m = input.trim().match(/^\((\d+)\)\s*(.+)$/);
  if (m) {
    return { code: m[1], name: m[2].trim() };
  }
  return { code: null, name: input.trim() };
}

/** Monta de volta a string "(codigo) NOME" para exibição/edição. */
export function formatCliente(
  code: string | null | undefined,
  name: string
): string {
  return code ? `(${code}) ${name}` : name;
}

/** Data de hoje no formato YYYY-MM-DD (horário local). */
export function todayISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export type OrderAlert = { level: "warn" | "danger"; text: string };

/**
 * Calcula o alerta de uma ordem conforme a data de disponibilidade e o perfil:
 *  - ADMIN/SUPERVISOR: chegou a data e ainda está "Aguardando" (não virou pendente).
 *  - EMPRESA: está "Pendente" e chegou (ou passou) a data de disponibilidade.
 * Retorna null quando não há alerta.
 */
export function getOrderAlert(
  order: ServiceOrder,
  role: Role
): OrderAlert | null {
  const disp = order.availability_at;
  if (!disp) return null;

  const hoje = todayISO();
  if (disp > hoje) return null; // ainda não chegou a data
  const passou = disp < hoje;

  if (role === "EMPRESA") {
    if (order.status === "PENDENTE") {
      return passou
        ? { level: "danger", text: "Passou da disponibilidade" }
        : { level: "warn", text: "Disponível hoje" };
    }
    return null;
  }

  // ADMIN / SUPERVISOR
  if (order.status === "AGUARDANDO") {
    return passou
      ? { level: "danger", text: "Passou da data e ainda aguardando" }
      : { level: "warn", text: "Disponibilidade hoje, ainda aguardando" };
  }
  return null;
}
