# Progresso — etapa final de engenharia (pendências da auditoria)

Projeto: `C:\Users\lucas\Projetos\ao-sindico-site` · produção: https://ao-sindico-site.vercel.app
Deploy: `vercel deploy --prod` a partir de cópia exportada (`git archive HEAD`) — commits com git bloqueiam no plano Hobby.
Banco local: `npm run db:local` (porta 5433) → `npx prisma db push` → `npm run db:steps` → `npx next dev`.

## Concluído (código)
- Formulários públicos: anti-robô só por campo invisível `hp_7f3` (o checagem por tempo/relógio descartava envios reais em silêncio). Robô agora recebe erro, não “sucesso falso”. (`src/lib/public-actions.ts`, `Forms.tsx`, `QuoteForm.tsx`)
- E-mail via Resend (`src/lib/email.ts`): aviso à equipe (pedido/anunciar/contato), confirmação ao solicitante e ao inscrito em evento, convite e nova senha por e-mail, botão “Enviar pelo sistema” para fornecedor (`emailQuoteToSupplier`). Sem `RESEND_API_KEY`/`EMAIL_FROM` nada é enviado e tudo segue com WhatsApp/mailto.
- Textos do site: `notify_email`, `contact_text`, `privacy_text`, `terms_text`. Páginas `/contato`, `/privacidade`, `/termos`; `/anuncie?contato=1` → `/contato`.
- SEO: `src/lib/site-url.ts` (SITE_URL → domínio de produção Vercel → localhost); robots/sitemap/canonical usam isso; prévias da Vercel com noindex. Canonical por página via header `x-pathname` no middleware.
- Seções vazias (vídeos, cursos, parceiros, eventos, colunistas): somem do menu/rodapé/sitemap e a página dá 404 (`src/lib/sections.ts`).
- Etapas de dados novas em `prisma/data-steps.ts`: `acervo-texto-v2` (limpeza em `prisma/text-fix.ts`, só em matérias não editadas), `acervo-avaliacoes-v1` (`prisma/acervo/avaliacoes.json`, 4 avaliações), migração de imagens legadas (`prisma/legacy-images.ts`, repete a cada deploy até zerar).

## Testado localmente (OK)
- Etapas: 375 textos limpos, 5 resumos refeitos, 4 avaliações, 503/503 imagens migradas; 2ª execução não altera nada.
- Gravam no banco com preenchimento rápido: Quero anunciar, Contato, newsletter, inscrição em evento, orçamento 5 etapas.
- Campo anti-robô preenchido → erro (não grava, não finge sucesso).
- Convite + perfil Comercial (acessa orçamentos/fornecedores/anúncios/avaliações; barrado em matérias/equipe/textos/histórico). Conteúdo testado na etapa anterior.
- E-mail: chave inválida → {sent:false} sem quebrar; sem chave → nada enviado, convite cai no link.
- Páginas vazias 404 e fora de menu/rodapé/sitemap; /contato /privacidade /termos 200; /anuncie?contato=1 → /contato.
- Regressão: todas as páginas públicas, redirects antigos, painel, imagens migradas respondendo.
- `tsc` e `next build` OK.

## Falta
- Commit, deploy (cópia exportada) e verificação em produção.

## Próximo passo exato
`git archive HEAD` → extrair em scratchpad\deploy → copiar `.vercel` → `npx vercel deploy --prod --yes --logs > deploy-prod.log` → conferir log (imagens-legadas, textos, avaliações) → testar produção.
