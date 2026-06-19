import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canChangeStatus } from "@/lib/permissions";
import { statusSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canChangeStatus(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: params.id },
  });
  if (!order) {
    return NextResponse.json({ error: "Ordem não encontrada" }, { status: 404 });
  }
  // Empresa só altera o status de ordens do próprio cliente.
  if (session.user.role === "EMPRESA" && order.clientId !== session.user.clientId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const updated = await prisma.serviceOrder.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json(updated);
}
