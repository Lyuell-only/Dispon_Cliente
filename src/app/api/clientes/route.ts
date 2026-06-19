import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageClients } from "@/lib/permissions";
import { clientSchema } from "@/lib/validation";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageClients(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, document, email, phone } = parsed.data;
  const client = await prisma.client.create({
    data: {
      name,
      document: document || null,
      email: email || null,
      phone: phone || null,
    },
  });
  return NextResponse.json(client, { status: 201 });
}
