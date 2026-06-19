import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@dispon.local";
  const adminPassword = "admin123";

  // Cliente de exemplo
  const acme = await prisma.client.upsert({
    where: { id: "seed-client-acme" },
    update: {},
    create: {
      id: "seed-client-acme",
      name: "ACME Indústria Ltda",
      document: "12.345.678/0001-90",
      email: "contato@acme.com",
      phone: "(11) 99999-0000",
    },
  });

  // Usuário ADMIN
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });

  // Usuário SUPERVISOR
  await prisma.user.upsert({
    where: { email: "supervisor@dispon.local" },
    update: {},
    create: {
      name: "Supervisor",
      email: "supervisor@dispon.local",
      password: await bcrypt.hash("super123", 10),
      role: "SUPERVISOR",
    },
  });

  // Usuário EMPRESA vinculado ao cliente ACME
  await prisma.user.upsert({
    where: { email: "empresa@dispon.local" },
    update: {},
    create: {
      name: "Empresa ACME",
      email: "empresa@dispon.local",
      password: await bcrypt.hash("empresa123", 10),
      role: "EMPRESA",
      clientId: acme.id,
    },
  });

  // Ordem de serviço de exemplo
  await prisma.serviceOrder.upsert({
    where: { id: "seed-order-1" },
    update: {},
    create: {
      id: "seed-order-1",
      title: "Manutenção do servidor de produção",
      type: "Manutenção",
      description: "Janela de indisponibilidade programada.",
      status: "ABERTA",
      clientId: acme.id,
      openedAt: new Date(),
      availabilityAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    },
  });

  console.log("Seed concluída.");
  console.log("Logins de teste:");
  console.log("  admin@dispon.local / admin123 (ADMIN)");
  console.log("  supervisor@dispon.local / super123 (SUPERVISOR)");
  console.log("  empresa@dispon.local / empresa123 (EMPRESA)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
