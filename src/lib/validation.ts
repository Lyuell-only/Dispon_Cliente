import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente"),
  document: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
});

export const orderCreateSchema = z.object({
  title: z.string().min(2, "Informe um título"),
  type: z.string().min(1, "Informe o tipo da ordem"),
  description: z.string().optional().nullable(),
  clientId: z.string().min(1, "Selecione o cliente"),
  status: z.enum(["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]).optional(),
  openedAt: z.string().optional().nullable(),
  availabilityAt: z.string().optional().nullable(),
});

export const orderUpdateSchema = orderCreateSchema.partial();

export const statusSchema = z.object({
  status: z.enum(["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]),
});

export const commentSchema = z.object({
  body: z.string().min(1, "O comentário não pode ficar vazio"),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
