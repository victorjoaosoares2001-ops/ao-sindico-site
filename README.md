# Ao Síndico — portal + painel da equipe

Portal do mercado condominial (fornecedores, síndicos profissionais, Informe-se, Tira-Dúvidas,
vídeos, eventos com inscrição, cursos, parceiros e pedidos de orçamento) com **painel da equipe**
em `/admin` para operar tudo sem desenvolvedor.

Stack: Next.js 15 (App Router, TypeScript) · Prisma · Postgres (Neon) · Vercel Blob · CSS próprio.

## Rodar localmente

```bash
npm install
cp .env.example .env            # aponte DATABASE_URL para o Postgres local abaixo
npm run db:local                # Postgres local (porta 5433), deixe rodando
npm run db:push                 # cria as tabelas
npm run db:steps                # conteúdo inicial + acervo + convite da dona (link no terminal)
npm run dev                     # http://localhost:3000 · painel: /admin
```

## Acesso ao painel (sem cadastro público)

- Não existe tela pública de criação de conta. **Todo acesso nasce de um convite** de uso único (72h).
- **Primeiro acesso (dona):** enquanto não existir dona/dono ativo, cada deploy gera um convite e o
  imprime **somente no log do build** (`[CONVITE-DONA] …`). Quem administra a Vercel abre o log e usa o link.
- **Equipe:** em *Equipe e acessos* a dona/administração gera convites com perfil e links de nova senha
  (WhatsApp ou copiar). “Esqueci minha senha” no login avisa a administração no painel.
- **Emergência:** `npm run admin:convite -- email@x.com "Nome" dono` (precisa de acesso ao banco).
- Segurança: senhas bcrypt; sessão assinada (12h) que cai ao trocar senha/perfil; bloqueio de 15 min
  após 5 tentativas erradas; histórico de ações; painel com `noindex` e `no-store`.

| Perfil | Pode usar |
| --- | --- |
| Dona/dono | tudo, inclusive equipe e perfis |
| Administração | tudo, menos promover alguém a dono |
| Comercial | orçamentos/mensagens, fornecedores, anúncios, parceiros, avaliações, agenda |
| Conteúdo | matérias, autores, seções, Tira-Dúvidas, vídeos, eventos e cursos |

## Fluxo comercial (prioridade da cliente)

Empresa fechada → *Fornecedores → Novo* → no perfil da empresa, **Novo anúncio desta empresa** →
imagem, link, posição (com tamanho recomendado), período, prioridade e ativo → aparece no site sozinho
nas datas definidas. Cliques são contados (`/anuncio/:id`). O painel avisa anúncios que vencem em 7 dias.

## Orçamentos (substitui a plataforma externa)

Formulário em 5 etapas (necessidade, condomínio, detalhes, contato, revisão) → *Orçamentos e mensagens*:
situação, responsável, observações, empresas sugeridas pela categoria/cidade, envio com texto pronto
por WhatsApp/e-mail, “marcar como enviado”, registro de cada contato e histórico completo.

## Estrutura

| Onde | O quê |
| --- | --- |
| `prisma/schema.prisma` | Modelo de dados |
| `prisma/data-steps.ts` | Etapas de dados por deploy (cada uma roda 1 vez por banco) |
| `prisma/acervo/*.json` | Acervo migrado do site antigo (`npm run acervo`) |
| `src/admin/resources.ts` | Cadastros do painel (campos em português; listagem/formulário gerados daqui) |
| `src/admin/actions.ts` | Ações do painel (permissões, histórico, convites, orçamentos) |
| `src/lib/permissions.ts` | Perfis e módulos |
| `src/lib/public-actions.ts` | Formulários públicos |
| `src/lib/placements.ts` | Posições de anúncio |

## Produção (Vercel)

`vercel-build` = `prisma generate && prisma db push && tsx prisma/data-steps.ts && next build`.
Variáveis criadas pela Vercel: `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (Neon) e `BLOB_READ_WRITE_TOKEN` (Blob).
Opcionais: `SITE_URL` (domínio final), `AUTH_SECRET`, `OWNER_EMAIL`.
Endereços do site antigo (`/informe/…`, `/fornecedor/…`, `/tiraduvidas/…`, `/colunista/…`) redirecionam para os novos.
