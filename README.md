# Dispon Cliente — Painel de Disponibilidade

Painel de controle para registrar **clientes**, **ordens de serviço**,
**data de abertura** e **data de disponibilidade**, com login e permissões
por perfil.

## Perfis e permissões

| Perfil       | Permissões                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `ADMIN`      | Controle total: usuários, clientes e ordens de serviço.                    |
| `SUPERVISOR` | Criar, editar e apagar ordens de serviço e clientes.                       |
| `EMPRESA`    | Visualizar e comentar **apenas** as ordens do próprio cliente; marcar status (ex.: concluída). |

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma** + **PostgreSQL**
- **NextAuth** (login por e-mail/senha, sessão JWT)
- **Tailwind CSS**
- **Zod** para validação

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o ambiente — copie `.env.example` para `.env` e ajuste:

   ```bash
   cp .env.example .env
   # edite DATABASE_URL e NEXTAUTH_SECRET
   ```

   Gere um segredo:

   ```bash
   openssl rand -base64 32
   ```

3. Crie o schema no banco e popule os dados iniciais:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse http://localhost:3000

## Usuários de teste (criados pelo seed)

| E-mail                     | Senha       | Perfil     |
| -------------------------- | ----------- | ---------- |
| admin@dispon.local         | admin123    | ADMIN      |
| supervisor@dispon.local    | super123    | SUPERVISOR |
| empresa@dispon.local       | empresa123  | EMPRESA    |

> Altere essas credenciais antes de ir para produção.

## Estrutura

```
prisma/
  schema.prisma        # Modelos: User, Client, ServiceOrder, Comment
  seed.ts              # Dados iniciais
src/
  app/
    api/               # Route handlers (auth, clientes, ordens, comentários, usuários)
    dashboard/         # Páginas protegidas (visão geral, ordens, clientes, usuários)
    login/             # Tela de login
  components/          # Sidebar, modais e providers
  lib/                 # prisma, auth, permissões, validação, utils
```

## Scripts

| Script             | Descrição                              |
| ------------------ | -------------------------------------- |
| `npm run dev`      | Servidor de desenvolvimento            |
| `npm run build`    | Gera o Prisma client e o build de prod |
| `npm run db:push`  | Aplica o schema no banco               |
| `npm run db:seed`  | Popula dados iniciais                  |
| `npm run db:studio`| Abre o Prisma Studio                   |
