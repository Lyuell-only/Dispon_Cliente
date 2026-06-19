export type Role = "ADMIN" | "SUPERVISOR" | "EMPRESA";

export type OrderStatus =
  | "AGUARDANDO"
  | "PENDENTE"
  | "NAO_REALIZADA"
  | "CONCLUIDA"
  | "CONCLUIDA_ATRASO";

export type Profile = {
  id: string;
  name: string;
  role: Role;
  prestadora_id: string | null;
  created_at: string;
};

export type ServiceOrder = {
  id: string;
  client_code: string | null;
  client_name: string;
  tipo: string;
  cidade: string;
  prestadora_id: string | null;
  observacao: string | null;
  status: OrderStatus;
  opened_at: string;
  availability_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  order_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
  author?: { name: string; role: Role } | null;
};
