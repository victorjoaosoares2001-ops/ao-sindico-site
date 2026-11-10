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

## Pedidos da reunião com a Luiza (26/10/2026)
- Orçamento, Tira-Dúvidas, Anuncie e Contato: **nome + WhatsApp obrigatórios** (e-mail saiu dos formulários). Ao enviar, grava no painel e abre o WhatsApp da Ao Síndico (Textos do site → WhatsApp) com o resumo pronto.
- Tira-Dúvidas: novo campo `askerPhone`; coluna "WhatsApp" clicável na lista e botão "Responder no WhatsApp" na pergunta.
- Mensagens: WhatsApp aparece na lista; detalhe mostra "Torres / blocos".
- Orçamento: avança sozinho ao escolher o serviço; nome do condomínio obrigatório; nº de torres/blocos (`Message.towers`) e nº de apartamentos.
- Home: removidos os contadores (empresas, síndicos, matérias, eventos) a pedido da cliente.
- Fornecedores (via painel): Pintura e Fachadas organizada na ordem enviada pela cliente; Innovare escondida.

## Pedidos da filha da dona (27/10/2026) — publicado (commit 71a1313)
- Importador agora lê `antigo.aosindico.com` (aosindico.com é o site novo); `order=az` traz os 58 fornecedores.
- Etapas `site-antigo-fornecedores-v2` (6 novas, 9 logos corrigidos; não recria removidas nem publica ocultas) e `site-antigo-banners-v1` (29 banners: topo→home, meio→faixa, lateral→lateral).
- Home: faixa rotativa de logos no fim; faixa do meio vira carrossel. Lateral rotativa em empresa/busca/Tira-Dúvidas (`AdCarousel`).
- Modo econômico (aparelhos ≤4 GB) não para mais letreiros/carrosséis.
- Página da empresa: sem WhatsApp/telefone/e-mail da empresa; contato via Ao Síndico.
- Pendente com a equipe: logos de Aki Limpe, MVT, Domínio Pinturas, CNN, Mega Engenheiros, MDG, Manutentudo (não existem no antigo); texto da Atlas repetido.

## Pedido da dona (30/10/2026) — publicado
- Etapa `site-antigo-todas-v3`: as 58 empresas do antigo no novo (13 reexibidas/recriadas). Innovare no fim (`innovare-fim-v1`: plano básico, ordem 9999) por estar em débito.
- Logos quebrados: a otimização de imagens da Vercel estourou a cota do plano (402). `images.unoptimized: true` em `next.config.ts`.
- `descricoes-v1`: descrição para as 13 empresas sem texto (só onde estava vazia).
- Pendente com a equipe: logos de Aki Limpe, Domínio Pinturas, CNN Engenharia, Mega Engenheiros, MDG Engenharia e Manutentudo (não existem no antigo nem dá para confirmar na internet).

## Inscrições em eventos (06/11/2026) — publicado
- Reclamação da Mari: painel antigo parado desde 15/10. Causa: o domínio passou para o site novo; as inscrições vão para o banco novo (16 entre 19/10 e 06/11, nenhuma perdida). As anteriores seguem em antigo.aosindico.com/panel; o formulário de antigo.aosindico.com ainda grava lá.
- Nova tela `/admin/inscricoes` no menu Dia a dia, com data, busca e planilha. Aviso por e-mail à equipe a cada inscrição (só sai com Resend configurado).

## Eventos e vídeos do site antigo (06/11/2026) — publicado
- Etapa `site-antigo-eventos-videos-v1`: 8 eventos passados (páginas de antigo.aosindico.com/eventos/*, fora da lista do antigo, e mini-sites eventos.aosindico.com/saopaulo e /guarulhos) e 14 vídeos (8 da home do antigo + 6 de eventos do canal; sem o sorteio).
- /eventos mostra o ano nas edições anteriores e os 3 últimos vídeos. Vídeos com sombra `--shadow-md`.
- Não importados por falta de data exata: 13º/10º/8º Congresso, 3º/2º Encontro Guarulhos etc. (estão só em Vídeos). Galeria de fotos do 5º Encontro (35 fotos) não veio: não há campo para galeria.

## Inscrições do painel antigo (06/11/2026)
- Painel antigo: sistema.aosindico.com/manager-setup. Mari/Luiza imprimem etiquetas por ele. Nova tela `/admin/inscricoes` copia a de lá: busca, evento, tipo, total, adicionar, editar, excluir, exportar, gerar etiqueta (uma ou o evento todo) com contador. Etiqueta 90×29 mm em HTML para imprimir; o QR é fixo (`public/legacy/etiqueta-qr.png`, vCard da Luiza), igual ao do PDF antigo.
- Removido o único (evento+e-mail): o antigo tem 413 repetidos. O site continua sem deixar repetir no formulário público.
- `prisma/legacy-registrations.ts`: importa de `prisma/privado/inscricoes-antigas.json`, fora do git (repo é público: nunca versionar dados de inscritos); roda no build porque o DATABASE_URL é sensível na Vercel. Refazível pelo `legacyId`.

## Patrocinadores e Condomínios do painel antigo (06/11/2026)
- Models `Sponsorship` e `Condominium`, seções no menu Comercial (cadastro genérico de `resources.ts`). Importados por `prisma/legacy-registrations.ts` a partir de `prisma/privado/` (fora do git), no build.
- Logos dos patrocinadores não vieram: o painel antigo só guarda o nome do arquivo, sem caminho público.

## Vercel Blob bloqueado (10/11/2026)
- A loja do Blob foi bloqueada e derrubou todas as fotos (403 "Your store is blocked"). Cópias do site antigo agora ficam em `public/legado/` (mesmo nome por hash); `prisma/legacy-images.ts` troca os endereços a cada deploy e avisa se faltar arquivo.
- Envio de imagem pelo painel grava no banco (`UploadFile`) na Vercel e é servido em `/uploads/<nome>`. Blob não é mais usado.
- Logo da ATLAS (enviada pelo painel) ficou presa no Blob: saiu do cartão e o endereço foi para as observações internas.
