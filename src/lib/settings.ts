import { cache } from "react";
import { db } from "./db";

/**
 * Textos e contatos editáveis em /admin/conteudo.
 * Cada chave tem rótulo e valor padrão; o banco guarda só o que foi alterado.
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
        default:
          "Receba orçamentos das melhores empresas para o seu condomínio, acompanhe notícias, cursos e eventos. Usado por mais de 30 mil síndicos e gestores — grátis, prático e seguro.",
      },
      { key: "hero_image", label: "Imagem de fundo do topo (opcional)", type: "image", default: "" },
    ],
  },
  {
    title: "Números de destaque",
    hint: "Aparecem logo abaixo do topo.",
    fields: [
      { key: "stat1_value", label: "Número 1", default: "+30 mil" },
      { key: "stat1_label", label: "Legenda 1", default: "síndicos e gestores" },
      { key: "stat2_value", label: "Número 2", default: "+500" },
      { key: "stat2_label", label: "Legenda 2", default: "fornecedores cadastrados" },
      { key: "stat3_value", label: "Número 3", default: "8" },
      { key: "stat3_label", label: "Legenda 3", default: "encontros de síndicos realizados" },
      { key: "stat4_value", label: "Número 4", default: "100%" },
      { key: "stat4_label", label: "Legenda 4", default: "gratuito para o síndico" },
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
      { key: "address", label: "Endereço / região", default: "São Paulo · SP" },
    ],
  },
  {
    title: "Anuncie",
    hint: "Página para empresas que querem anunciar.",
    fields: [
      { key: "advertise_title", label: "Título", default: "Coloque sua empresa na frente de quem decide." },
      {
        key: "advertise_text",
        label: "Texto",
        type: "textarea",
        default:
          "Síndicos, administradoras e gestores consultam o Ao Síndico todos os dias para encontrar fornecedores. Anuncie no portal, patrocine nossos encontros e receba pedidos de orçamento qualificados.",
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
        default:
          "Ao Síndico: orçamentos gratuitos com fornecedores para condomínios, notícias, cursos e eventos para síndicos e gestores.",
      },
    ],
  },
] as const;

type Field = (typeof SETTING_GROUPS)[number]["fields"][number];
export type SettingKey = Field["key"];
export type Settings = Record<SettingKey, string>;

export const SETTING_DEFAULTS = Object.fromEntries(
  SETTING_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default])),
) as Settings;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.siteSetting.findMany();
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in out) out[r.key as SettingKey] = r.value;
  return out;
});
