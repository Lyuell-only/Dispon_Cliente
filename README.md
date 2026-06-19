# Dispon Cliente — Painel de Disponibilidade

Painel para registrar **ordens de serviço** (cliente, tipo, cidade, datas e
observação), com **sugestão automática da prestadora** por cidade + tipo, login
e permissões por perfil.

Arquitetura: **SPA estática (Vite + React)** hospedada no **GitHub Pages**, com
**Supabase** (Postgres + Auth + RLS) como backend.

## Perfis e permissões

| Perfil       | Permissões                                                                       |
| ------------ | -------------------------------------------------------------------------------- |
| `ADMIN`      | Controle total: ordens, status e usuários.                                       |
| `SUPERVISOR` | Criar, editar e apagar ordens de serviço.                                        |
| `EMPRESA`    | Ver e comentar **apenas** as OS encaminhadas à sua prestadora; alterar o status (ex.: marcar como concluída). |

O escopo da EMPRESA é garantido no banco via **Row Level Security** — um usuário
empresa não acessa OS de outra prestadora nem por requisição direta.

## Como funciona o registro de OS

- O cliente **não é cadastrado**: digite código + nome no mesmo campo, no formato
  `(231232) CLIENTE TALTALTAL` (o sistema separa código e nome automaticamente).
- Campos da OS: **tipo**, **cidade**, **data de abertura**, **data de
  disponibilidade**, **observação** e **prestadora**.
- A **prestadora** é sugerida automaticamente conforme a cidade + tipo (regras em
  `src/config/prestadoras.ts`). Admin e supervisor podem trocar para qualquer
  prestadora.

## Configurar as prestadoras e regras

Edite [`src/config/prestadoras.ts`](src/config/prestadoras.ts):

- `PRESTADORAS` — lista de empresas que recebem as OS.
- `REGRAS_SUGESTAO` — mapeia cidade (+ tipo opcional) → prestadora sugerida.
- `TIPOS_OS` — tipos disponíveis no formulário.

Depois de editar, basta publicar (o deploy é automático).

## Configurar o Supabase

1. Crie um projeto grátis em https://supabase.com.
2. No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
3. Em **Settings → API**, copie a **URL** e a **anon key**.
4. Crie seu usuário (pela tela de login do app ou em **Authentication → Users**).
5. Promova-o a admin no **SQL Editor**:

   ```sql
   update public.profiles set role = 'ADMIN'
   where id = (select id from auth.users where email = 'voce@exemplo.com');
   ```

> Opcional: desative a confirmação de e-mail em **Authentication → Providers →
> Email** para facilitar os testes.

## Rodar localmente

```bash
cp .env.example .env     # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Publicar no GitHub Pages

1. Em **Settings → Pages**, defina **Source = GitHub Actions**.
2. Em **Settings → Secrets and variables → Actions**, crie os secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça push na branch `main`. O workflow
   [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builda e publica.

O site ficará em `https://<seu-usuario>.github.io/Dispon_Cliente/`.

> O `base` do Vite está como `/Dispon_Cliente/` (nome do repositório, com o mesmo
> case). O caminho do GitHub Pages diferencia maiúsculas de minúsculas — se você
> renomear o repositório, ajuste `base` em `vite.config.ts` exatamente igual.

## Estrutura

```
supabase/schema.sql        # Tabelas, RLS, funções e trigger
src/
  config/prestadoras.ts    # Prestadoras + regras de sugestão (edite aqui)
  lib/                     # supabase, tipos, permissões, utils
  auth/AuthContext.tsx     # Sessão + perfil
  components/              # Layout, modal de OS
  pages/                   # Login, Dashboard, Ordens, OrdemDetalhe, Usuarios
.github/workflows/deploy.yml
```

## Observações de segurança

- A **anon key** é pública (vai no build estático) — isso é esperado. A proteção
  real dos dados é feita pelas políticas de **RLS** no Supabase.
- A troca de status passa pela função `set_order_status` (SECURITY DEFINER), que
  valida a permissão do usuário no servidor.
