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

## Produção (07/10/2026, commit f848037) — CONCLUÍDO
- Log do build: 375 textos limpos, 5 resumos refeitos, 4 avaliações, 503/503 imagens no Vercel Blob.
- Verificado (somente leitura, sem criar dados de teste): /contato /privacidade /termos 200; /videos /cursos /parceiros 404 e fora do menu; robots/sitemap/canonical com o domínio de produção (sem localhost); 0 imagens do servidor antigo; imagem migrada servida pelo Blob.
- A dona já criou o acesso em produção (nenhum convite novo gerado).

## Depende de configuração externa
- E-mail: `RESEND_API_KEY` + `EMAIL_FROM` na Vercel (domínio verificado no Resend) e e-mail da equipe em Textos do site → Contato.
- Domínio final: apontar aosindico.com e definir `SITE_URL`.
- Publicação automática pelo GitHub: repositório e Vercel em contas diferentes (Hobby bloqueia).

## Próximo passo
Acabamento visual (outra ferramenta). Nenhuma pendência de engenharia aberta desta lista.
