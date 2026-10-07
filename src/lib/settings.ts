import { cache } from "react";
import { db } from "./db";

/**
 * Textos e contatos editáveis em /admin/conteudo.
 * Cada chave tem rótulo e valor padrão; o banco guarda só o que foi alterado.
 * type "lista": um item por linha.
 */
export const SETTING_GROUPS = [
  {
    title: "Página inicial",
    hint: "O que aparece no topo do site.",
    fields: [
      { key: "hero_kicker", label: "Selo acima do título", default: "Portal do mercado condominial" },
      { key: "hero_title", label: "Título principal", default: "Tudo o que o seu condomínio precisa," },
      { key: "hero_title_accent", label: "Final do título (em destaque)", default: "em um só lugar." },
      {
        key: "hero_subtitle",
        label: "Texto de apoio",
        type: "textarea",
        default: "Receba orçamentos de empresas especializadas para o seu condomínio, acompanhe notícias, cursos e eventos. Grátis, prático e seguro.",
      },
      { key: "hero_image", label: "Imagem de fundo do topo (opcional)", type: "image", default: "" },
    ],
  },
  {
    title: "Contato",
    hint: "Usados no rodapé, botão de WhatsApp e páginas de contato.",
    fields: [
      { key: "whatsapp", label: "WhatsApp (com DDD)", default: "(11) 94005-6720" },
      { key: "phone", label: "Telefone", default: "" },
      { key: "email", label: "E-mail", default: "contato@aosindico.com" },
      { key: "instagram", label: "Instagram (link)", default: "https://www.instagram.com/aosindico" },
      { key: "facebook", label: "Facebook (link)", default: "" },
      { key: "linkedin", label: "LinkedIn (link)", default: "" },
      { key: "youtube", label: "YouTube (link)", default: "" },
      { key: "whatsapp_group", label: "Grupo de WhatsApp dos síndicos (link)", default: "" },
      { key: "address", label: "Endereço / região", default: "São Paulo · SP" },
      {
        key: "notify_email",
        label: "E-mail(s) da equipe que recebem aviso de novos pedidos e mensagens",
        default: "",
        hint: "Separe por vírgula. Só funciona com o envio de e-mail configurado na hospedagem.",
      },
    ],
  },
  {
    title: "Páginas institucionais",
    hint: "Textos de /contato, /privacidade e /termos. Aceitam ## subtítulo, **negrito** e listas com -.",
    fields: [
      {
        key: "contact_text",
        label: "Texto da página Contato",
        type: "textarea",
        default: "Fale com a equipe Ao Síndico para dúvidas, sugestões, parcerias ou para anunciar. Respondemos em até 1 dia útil.",
      },
      {
        key: "privacy_text",
        label: "Política de Privacidade",
        type: "textarea",
        default: `Esta política explica como o Portal Ao Síndico trata os dados pessoais enviados pelo site, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

## Quais dados coletamos
- **Pedidos de orçamento:** nome, e-mail, telefone/WhatsApp, função, dados do condomínio (nome, tipo, número de unidades, cidade e bairro) e a descrição do serviço.
- **Contato e anúncios:** nome, empresa, e-mail, telefone, cidade e a mensagem enviada.
- **Inscrição em eventos:** nome, e-mail, telefone, função, condomínio, cidade e número de unidades.
- **Tira-Dúvidas e avaliações:** nome, e-mail (opcional, não publicado), cidade ou condomínio e o texto enviado.
- **Newsletter:** e-mail.

## Para que usamos
- Encaminhar o pedido de orçamento às empresas escolhidas por você ou indicadas pela nossa equipe, para que elas façam contato.
- Responder mensagens, organizar eventos, emitir certificados e enviar novidades a quem se inscreveu.
- Publicar perguntas, respostas e avaliações (sem e-mail ou telefone).

## Compartilhamento
Os dados de um pedido de orçamento são compartilhados apenas com as empresas a que o pedido for encaminhado. Não vendemos dados pessoais.

## Seus direitos
Você pode pedir acesso, correção ou exclusão dos seus dados e cancelar a newsletter a qualquer momento pelo e-mail de contato do portal.

## Guarda e segurança
Os dados ficam em servidores com acesso restrito à equipe autorizada, pelo tempo necessário para o atendimento ou exigido por lei.`,
      },
      {
        key: "terms_text",
        label: "Termos de uso",
        type: "textarea",
        default: `Ao usar o Portal Ao Síndico, você concorda com estes termos.

## O portal
O Ao Síndico reúne conteúdo, guia de fornecedores, eventos e um serviço gratuito de encaminhamento de pedidos de orçamento para condomínios.

## Pedidos de orçamento
O portal aproxima síndicos e empresas, mas não é parte do contrato entre eles. Preços, prazos, garantias e execução dos serviços são de responsabilidade de cada empresa. Recomendamos comparar propostas e verificar referências antes de contratar.

## Conteúdo
Matérias, respostas do Tira-Dúvidas e vídeos têm caráter informativo e não substituem orientação profissional individual (jurídica, técnica ou contábil).

## Avaliações e perguntas
Avaliações e perguntas passam por moderação. Podemos recusar ou remover conteúdo ofensivo, falso, com dados pessoais de terceiros ou sem relação com o tema.

## Anúncios
Banners e perfis patrocinados são identificados como publicidade. A responsabilidade pelas ofertas anunciadas é do anunciante.

## Alterações
Estes termos podem ser atualizados; a versão publicada nesta página é a vigente.`,
      },
    ],
  },
  {
    title: "Anuncie",
    hint: "Página para empresas que querem anunciar e bloco no fim da página inicial.",
    fields: [
      { key: "advertise_title", label: "Título", default: "Coloque sua empresa na frente de quem decide." },
      {
        key: "advertise_text",
        label: "Texto",
        type: "textarea",
        default:
          "Síndicos, administradoras e gestores consultam o Ao Síndico para encontrar fornecedores. Anuncie no portal, patrocine nossos encontros e receba pedidos de orçamento.",
      },
      {
        key: "advertise_formats",
        label: "Formatos oferecidos (um por linha)",
        type: "lista",
        default:
          "Perfil no guia de fornecedores, com selo Verificado ou Premium\nBanner na página inicial, nas matérias e no guia\nPedidos de orçamento encaminhados pela nossa equipe\nPatrocínio dos Encontros de Síndicos\nMatéria patrocinada e coluna própria",
      },
    ],
  },
  {
    title: "Síndicos profissionais",
    hint: "Página /sindicos-profissionais.",
    fields: [
      { key: "pro_title", label: "Título", default: "Encontre um síndico profissional para o seu condomínio." },
      {
        key: "pro_text",
        label: "Texto",
        type: "textarea",
        default: "Conheça profissionais que atuam na gestão de condomínios residenciais e comerciais. Compare perfis e peça uma proposta sem compromisso.",
      },
    ],
  },
  {
    title: "Sobre e SEO",
    hint: "Texto institucional e descrição mostrada no Google.",
    fields: [
      {
        key: "about_text",
        label: "Sobre a Ao Síndico (rodapé)",
        type: "textarea",
        default: "O portal que conecta síndicos, condomínios e as melhores empresas do mercado condominial.",
      },
      {
        key: "seo_description",
        label: "Descrição para o Google",
        type: "textarea",
        default: "Ao Síndico: orçamentos gratuitos com fornecedores para condomínios, notícias, Tira-Dúvidas, cursos e eventos para síndicos e gestores.",
      },
    ],
  },
] as const;

type Field = (typeof SETTING_GROUPS)[number]["fields"][number];
export type SettingKey = Field["key"];
export type Settings = Record<SettingKey, string>;

export const SETTING_DEFAULTS = Object.fromEntries(SETTING_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default]))) as Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.siteSetting.findMany();
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
});

export const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
