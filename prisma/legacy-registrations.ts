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
