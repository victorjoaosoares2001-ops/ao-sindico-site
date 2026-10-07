# Ao Síndico — site + painel

Novo site do portal **Ao Síndico** (conteúdo, fornecedores, cursos/eventos, parceiros e
pedidos de orçamento) com um **painel da equipe** em `/admin` onde tudo é cadastrado sem
depender de desenvolvedor.

Stack: Next.js 15 (App Router, TypeScript) · Prisma · SQLite local (Postgres/MySQL em produção) ·
CSS próprio (sem framework) · sem serviços pagos.

## Rodar

```bash
npm install
cp .env.example .env      # ajuste AUTH_SECRET e ADMIN_PASSWORD
npm run setup             # cria o banco e carrega o conteúdo inicial + 1º acesso
npm run dev               # http://localhost:3000  ·  painel: /admin
```

Build de produção: `npm run build && npm start`. Checagem de tipos: `npm run typecheck`.

## Como está organizado

| Onde | O quê |
| --- | --- |
| `prisma/schema.prisma` | Tabelas: fornecedores, categorias, anúncios, matérias, seções, cursos, eventos, parceiros, mensagens, textos do site, equipe |
| `prisma/seed-content.ts` | Conteúdo migrado do site atual (imagens ainda apontam para aosindico.com) |
| `src/app/(site)` | Páginas públicas |
| `src/app/admin` | Painel (login, início, mensagens, cadastros, textos, equipe) |
| `src/admin/resources.ts` | **Definição dos cadastros do painel** — campos e rótulos em português. Listagem, formulário e gravação são gerados daqui |
| `src/admin/actions.ts` | Ações do painel (salvar, publicar, mensagens, equipe) |
| `src/lib/public-actions.ts` | Formulários públicos (orçamento, anuncie/contato, newsletter) |
| `src/lib/settings.ts` | Textos editáveis em “Textos do site” |

Novo cadastro: crie o model no schema, rode `npm run db:push` e adicione um item em `RESOURCES`.

## Fluxo de mensagens (substitui a plataforma externa)

1. O síndico pede orçamento no site (início, `/orcamento` ou página do fornecedor) — ou uma empresa pede para anunciar (`/anuncie`).
2. Cai em **Painel → Mensagens → Responder**.
3. A funcionária abre, relaciona as empresas, envia o pedido a cada uma pelo WhatsApp/e-mail com texto pronto e marca “enviado”.
4. Muda para **Respondido** e registra observações internas.

## Produção

- **Banco:** troque `provider` em `schema.prisma` para `postgresql` (ou `mysql`) e defina `DATABASE_URL`; depois `npx prisma db push && npm run db:seed`.
- **Imagens enviadas:** ficam em `UPLOAD_DIR` (padrão `./uploads`) e são servidas em `/uploads/...`. O servidor precisa de disco persistente (VPS/hospedagem Node). Em hospedagem sem disco (ex.: Vercel), troque `src/lib/upload.ts` por um storage (S3, R2, Vercel Blob).
- **Segurança:** gere um `AUTH_SECRET` novo e troque a senha inicial em Painel → Equipe e senha.
- `SITE_URL` com o domínio final (sitemap e SEO).
