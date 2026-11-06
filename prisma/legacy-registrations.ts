/**
 * Inscrições do painel antigo (sistema.aosindico.com). O JSON com os dados fica em prisma/privado/ (fora do git:
 * dados pessoais, repositório público) e só vai junto numa publicação pontual. Pode rodar de novo: pula quem já tem legacyId.
 */
import { readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";

type Old = { id: number; nome: string; data: string; email: string; tel: string; etq: number; condo: string; tipo: string; evento: string };

// início do nome no painel antigo → endereço do evento no site novo
const EVENTS: [string, string][] = [
  ["8° Encontro de Síndicos de Guarulhos", "8-encontro-de-sindicos-de-guarulhos-e-regiao"],
  ["16º Congresso", "16-congresso-de-sindicos-em-sao-paulo"],
  ["5° Encontro de Zeladores", "5-encontro-de-zeladores-e-gerente-predial"],
  ["7º Encontro de Síndicos de Guarulhos", "7-encontro-de-sindicos-de-guarulhos-e-regiao"],
  ["4° Encontro de zeladores", "4-encontro-de-zeladores-e-gerente-predial"],
  ["15° Congresso", "15-congresso-de-sindicos-de-sao-paulo-e-regioes"],
  ["Curso Online -  Mediação", "curso-online-mediacao-de-conflito"],
  ["Curso Online - Mediação", "curso-online-mediacao-de-conflito"],
  ["3º Encontro de Síndicos do ABC", "3-encontro-de-sindicos-do-abc"],
  ["1° Encontro de Zeladores", "1-encontro-de-zeladores-de-sao-paulo-e-regioes"],
  ["10º Congresso", "10-congresso-portal-aosindico-com"],
  ["Curso de CIPA", "curso-de-cipa"],
  ["Curso Porteiro", "curso-porteiro-predial"],
  ["Curso Online - Zelador", "curso-online-zelador-predial"],
  ["Curso Presencial", "curso-presencial-sindico-profissional"],
  ["3º Encontro Síndicos Guarulhos", "3-encontro-de-sindicos-de-guarulhos"],
  ["2º Encontro no ABC", "2-encontro-no-abc"],
  ["Quem Somos", "quem-somos-inscricao-avulsa"],
];

type OldSponsor = { id: number; lst?: string; int_sttus?: string; int_evento?: string; str_empresa?: string; str_segmento?: string; str_contato?: string; str_email?: string; str_telefone?: string; str_valor?: string; extra?: string[][] };
const txt = (v: string | undefined, max: number) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, max) || null;
const STATUS: Record<string, string> = { cancelado: "cancelado", confirmado: "confirmado", negociando: "negociando", "a receber": "a-receber" };

export async function importLegacySponsors(db: PrismaClient, file: string) {
  const rows: OldSponsor[] = JSON.parse(readFileSync(file, "utf8"));
  const events = await db.event.findMany({ select: { id: true, slug: true } });
  const SP: [RegExp, string][] = [
    [/^1.{0,2} Encontro de Zeladores/i, "1-encontro-de-zeladores-de-sao-paulo-e-regioes"],
    [/^10/, "10-congresso-portal-aosindico-com"],
    [/^3.{0,2} Encontro S[ií]ndicos Guarulhos/i, "3-encontro-de-sindicos-de-guarulhos"],
  ];
  const done = new Set((await db.sponsorship.findMany({ where: { legacyId: { not: null } }, select: { legacyId: true } })).map((r) => r.legacyId));
  const data = rows.filter((r) => !done.has(r.id)).map((r) => {
    const slug = SP.find(([re]) => re.test(r.int_evento ?? ""))?.[1];
    const status = STATUS[(r.int_sttus || r.lst || "").trim().toLowerCase()];
    if (!status) throw new Error(`Situação desconhecida no patrocinador ${r.id}`);
    return {
      legacyId: r.id,
      company: txt(r.str_empresa, 160) ?? `Patrocinador ${r.id}`,
      segment: txt(r.str_segmento, 120),
      contact: txt(r.str_contato, 120),
      email: txt(r.str_email, 160),
      phone: txt(r.str_telefone, 60),
      value: txt(r.str_valor, 60),
      status,
      eventId: events.find((e) => e.slug === slug)?.id ?? null,
      // colunas: ID, Nome (a 1ª linha; o resto da célula é da tela antiga), E-mail, Telefone
      staff: (r.extra ?? []).map((c) => [c[1]?.split("\n")[0], c[2], c[3]].map((v) => v?.trim()).filter(Boolean).join(", ")).filter(Boolean).join("\n") || null,
    };
  });
  await db.sponsorship.createMany({ data });
  console.log(`✔ patrocinadores-antigos — arquivo: ${rows.length} · já importados: ${done.size} · novos: ${data.length} · total: ${await db.sponsorship.count()}`);
}

type OldCondo = { id: number; nome: string; operador?: string; orc?: number; regiao?: string; int_operador?: string; str_Titulo?: string; str_email?: string; str_telefone?: string; str_cep?: string; str_endereco?: string; str_numero?: string; str_bairro?: string; str_cidade?: string; str_uf?: string };

export async function importLegacyCondos(db: PrismaClient, file: string) {
  const rows: OldCondo[] = JSON.parse(readFileSync(file, "utf8"));
  const done = new Set((await db.condominium.findMany({ where: { legacyId: { not: null } }, select: { legacyId: true } })).map((r) => r.legacyId));
  const data = rows.filter((r) => !done.has(r.id)).map((r) => {
    const [cidade, uf] = (r.regiao ?? "").split("/").map((s) => s.trim());
    return {
      legacyId: r.id,
      name: txt(r.str_Titulo || r.nome, 200) ?? `Condomínio ${r.id}`,
      operator: txt(r.int_operador || r.operador, 80),
      quotes: r.orc ?? 0,
      email: txt(r.str_email, 160),
      phone: txt(r.str_telefone, 60),
      zipcode: txt(r.str_cep, 12),
      address: txt(r.str_endereco, 200),
      number: txt(r.str_numero, 30),
      district: txt(r.str_bairro, 100),
      city: txt(r.str_cidade || cidade, 100),
      state: txt(r.str_uf || uf, 2),
    };
  });
  if (new Set(rows.map((r) => r.id)).size !== rows.length) throw new Error("Nº antigo repetido no arquivo");
  for (let i = 0; i < data.length; i += 500) await db.condominium.createMany({ data: data.slice(i, i + 500) });
  console.log(`✔ condominios-antigos — arquivo: ${rows.length} · já importados: ${done.size} · novos: ${data.length} · total: ${await db.condominium.count()}`);
}

export async function importLegacyRegistrations(db: PrismaClient, file: string) {
  const rows: Old[] = JSON.parse(readFileSync(file, "utf8"));
  const events = await db.event.findMany({ select: { id: true, slug: true } });
  const idOf = (evento: string) => {
    const slug = EVENTS.find(([p]) => evento.startsWith(p))?.[1];
    const id = events.find((e) => e.slug === slug)?.id;
    if (!id) throw new Error(`Evento sem correspondência: ${evento}`);
    return id;
  };
  // valida tudo antes de gravar qualquer coisa
  const data = rows.map((r) => {
    const [d, m, y] = r.data.split("/");
    return {
      legacyId: r.id,
      eventId: idOf(r.evento),
      name: r.nome.replace(/\s+/g, " ").trim().slice(0, 120),
      email: r.email.trim().toLowerCase().slice(0, 160),
      phone: r.tel.trim().slice(0, 40) || null,
      condo: r.condo.replace(/\s+/g, " ").trim().slice(0, 160) || null,
      role: (r.tipo === "Patriocinador" ? "Patrocinador" : r.tipo) || null,
      labelCount: r.etq,
      createdAt: new Date(`${y}-${m}-${d}T12:00:00-03:00`),
    };
  });
  if (new Set(data.map((r) => r.legacyId)).size !== data.length) throw new Error("Nº antigo repetido no arquivo");

  const done = new Set((await db.eventRegistration.findMany({ where: { legacyId: { not: null } }, select: { legacyId: true } })).map((r) => r.legacyId));
  const todo = data.filter((r) => !done.has(r.legacyId));
  const before = await db.eventRegistration.count();
  for (let i = 0; i < todo.length; i += 500) await db.eventRegistration.createMany({ data: todo.slice(i, i + 500) });
  console.log(`✔ inscricoes-antigas — arquivo: ${data.length} · já importadas: ${done.size} · novas: ${todo.length} · total antes: ${before} · total depois: ${await db.eventRegistration.count()}`);
}
