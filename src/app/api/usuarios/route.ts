import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/permissions";

const userSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  role: z.enum(["ADMIN", "SUPERVISOR", "EMPRESA"]),
  clientId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      clientId: true,
      client: { select: { name: true } },
      createdAt: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 }
    );
  }

  const { name, email, password, role, clientId } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      role,
      clientId: role === "EMPRESA" ? clientId || null : null,
    },
    select: { id: true, name: true, email: true, role: true },
  });
  return NextResponse.json(user, { status: 201 });
}
