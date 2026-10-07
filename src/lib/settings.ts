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
