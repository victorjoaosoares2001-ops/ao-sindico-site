"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { slugify } from "./format";
import { sendQuietly } from "./email";
import { getSettings } from "./settings";
import { siteUrl } from "./site-url";

export type PublicFormState = { ok?: boolean; error?: string; message?: string; link?: string; protocol?: string };

const get = (form: FormData, k: string, max = 2000) => String(form.get(k) ?? "").trim().slice(0, max);

/**
 * Anti-robô: só o campo invisível "hp_7f3" (nome que o preenchimento automático do
 * navegador não reconhece). Não usamos tempo de preenchimento: o relógio do navegador
 * pode estar adiantado e isso descartava envios reais em silêncio.
 */
const HONEYPOT = "hp_7f3";
function isBot(form: FormData) {
  return get(form, HONEYPOT) !== "";
}
const BOT: PublicFormState = { error: "Não foi possível enviar. Atualize a página e tente novamente." };

/** Avisa a equipe (e-mails em Textos do site → Contato). Sem e-mail configurado, não faz nada. */
async function notifyTeam(subject: string, lines: (string | null | undefined | false)[], replyTo?: string) {
  const s = await getSettings();
  const to = s.notify_email || s.email;
  if (!to) return;
  await sendQuietly({ to, subject, text: lines.filter(Boolean).join("\n\n"), replyTo: replyTo || null });
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validContact(name: string, email: string, phone: string) {
  if (name.length < 2) return "Informe seu nome.";
  if (!email && !phone) return "Informe um e-mail ou telefone para retornarmos.";
  if (email && !EMAIL.test(email)) return "E-mail inválido.";
  if (phone && phone.replace(/\D/g, "").length < 10) return "Telefone incompleto: inclua o DDD.";
  return null;
}

/** Pedido de orçamento (5 etapas) → Mensagens no painel. */
export async function submitQuote(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return BOT;
  const name = get(form, "name", 120);
  const email = get(form, "email", 160).toLowerCase();
  const phone = get(form, "phone", 40);
  const body = get(form, "body", 4000);
  const category = get(form, "category", 120);
  const err = validContact(name, email, phone);
  if (err) return { error: err };
  if (!category) return { error: "Escolha o tipo de serviço." };
  if (body.length < 10) return { error: "Descreva o que o condomínio precisa (pelo menos uma frase)." };
  if (!get(form, "city")) return { error: "Informe a cidade do condomínio." };

  const supplierIds = form.getAll("suppliers").map(String).filter(Boolean).slice(0, 10);
  const valid = supplierIds.length
    ? await db.supplier.findMany({ where: { id: { in: supplierIds }, published: true }, select: { id: true } })
    : [];

  const msg = await db.message.create({
    data: {
      type: "orcamento",
      name,
      email: email || null,
      phone: phone || null,
      contactRole: get(form, "contactRole", 60) || null,
      company: get(form, "company", 160) || null,
      condoType: get(form, "condoType", 40) || null,
      units: get(form, "units", 20) || null,
      city: get(form, "city", 80) || null,
      state: get(form, "state", 2).toUpperCase() || null,
      neighborhood: get(form, "neighborhood", 80) || null,
      category,
      urgency: get(form, "urgency", 60) || null,
      budget: get(form, "budget", 60) || null,
      preferredTime: get(form, "preferredTime", 60) || null,
      subject: `Orçamento: ${category}`,
      body,
      source: get(form, "source", 120) || null,
      suppliers: { create: valid.map((s) => ({ supplierId: s.id, requested: true })) },
    },
  });
  revalidatePath("/admin", "layout");
  const protocol = msg.id.slice(-6).toUpperCase();
  await notifyTeam(`Novo pedido de orçamento #${protocol}: ${category}`, [
    `*${name}*${get(form, "company") ? ` · ${get(form, "company")}` : ""}`,
    `${category} · ${[get(form, "neighborhood"), get(form, "city")].filter(Boolean).join(", ")}`,
    body,
    `Contato: ${[phone, email].filter(Boolean).join(" · ")}`,
    `Abrir no painel: ${siteUrl()}/admin/mensagens/${msg.id}`,
  ], email);
  if (email) {
    await sendQuietly({
      to: email,
      subject: `Recebemos seu pedido de orçamento (#${protocol})`,
      text: `Olá, ${name.split(" ")[0]}!\n\nRecebemos seu pedido de orçamento para *${category}*. Nossa equipe vai encaminhá-lo às empresas e você será contatado em breve.\n\nProtocolo: #${protocol}\n\nSe precisar complementar alguma informação, é só responder este e-mail.`,
    });
  }
  return {
    ok: true,
    protocol,
    message: "Recebemos seu pedido. Nossa equipe vai encaminhar às empresas e você será contatado em breve.",
  };
}

/** Empresa querendo anunciar ou contato geral. */
export async function submitContact(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return BOT;
  const name = get(form, "name", 120);
  const email = get(form, "email", 160).toLowerCase();
  const phone = get(form, "phone", 40);
  const err = validContact(name, email, phone);
  if (err) return { error: err };
  const type = get(form, "type") === "contato" ? "contato" : "anunciar";
  await db.message.create({
    data: {
      type,
      name,
      email: email || null,
      phone: phone || null,
      company: get(form, "company", 160) || null,
      city: get(form, "city", 80) || null,
      subject: get(form, "subject", 160) || (type === "anunciar" ? "Quero anunciar" : "Contato pelo site"),
      budget: get(form, "budget", 60) || null,
      body: get(form, "body", 4000) || null,
      source: get(form, "source", 120) || null,
    },
  });
  revalidatePath("/admin", "layout");
  await notifyTeam(`${type === "anunciar" ? "Quer anunciar" : "Contato pelo site"}: ${name}${get(form, "company") ? ` (${get(form, "company")})` : ""}`, [
    `*${get(form, "subject") || (type === "anunciar" ? "Quero anunciar" : "Contato pelo site")}*`,
    get(form, "body"),
    `Contato: ${[phone, email].filter(Boolean).join(" · ")}`,
    `Abrir no painel: ${siteUrl()}/admin/mensagens`,
  ], email);
  return { ok: true, message: type === "anunciar" ? "Mensagem recebida! Nossa equipe comercial retorna em até 1 dia útil." : "Mensagem recebida! Retornaremos em até 1 dia útil." };
}

export async function subscribe(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return BOT;
  const email = get(form, "email", 160).toLowerCase();
  if (!EMAIL.test(email)) return { error: "Digite um e-mail válido." };
  await db.subscriber.upsert({ where: { email }, create: { email, name: get(form, "name", 120) || null }, update: {} });
  return { ok: true, message: "Pronto! Você vai receber nossas novidades." };
}

/** Tira-Dúvidas: pergunta vai para moderação no painel. */
export async function submitQuestion(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return BOT;
  const title = get(form, "title", 200);
  const askerName = get(form, "name", 120);
  const askerEmail = get(form, "email", 160).toLowerCase();
  if (title.length < 10) return { error: "Escreva sua pergunta com um pouco mais de detalhe." };
  if (askerName.length < 2) return { error: "Informe seu nome." };
  if (askerEmail && !EMAIL.test(askerEmail)) return { error: "E-mail inválido." };
  let slug = slugify(title) || "pergunta";
  if (await db.question.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
  await db.question.create({
    data: {
      title,
      slug,
      body: get(form, "body", 3000) || null,
      askerName,
      askerEmail: askerEmail || null,
      askerCity: get(form, "city", 80) || null,
      sectionId: get(form, "sectionId", 40) || null,
    },
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Pergunta enviada! Nossos especialistas vão responder e ela aparecerá no Tira-Dúvidas." };
}

/** Avaliação de fornecedor: entra como pendente. */
export async function submitReview(supplierId: string, _: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return BOT;
  const name = get(form, "name", 120);
  const rating = Number(get(form, "rating"));
  const email = get(form, "email", 160).toLowerCase();
  if (name.length < 2) return { error: "Informe seu nome." };
  if (!(rating >= 1 && rating <= 5)) return { error: "Escolha uma nota de 1 a 5 estrelas." };
  if (email && !EMAIL.test(email)) return { error: "E-mail inválido." };
  const supplier = await db.supplier.findFirst({ where: { id: supplierId, published: true }, select: { id: true } });
  if (!supplier) return { error: "Empresa não encontrada." };
  await db.review.create({
    data: { supplierId, name, email: email || null, condo: get(form, "condo", 160) || null, rating, comment: get(form, "comment", 2000) || null },
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Obrigado! Sua avaliação será publicada após a conferência da nossa equipe." };
}

/** Inscrição em evento. */
export async function registerForEvent(eventId: string, _: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return BOT;
  const event = await db.event.findFirst({ where: { id: eventId, published: true }, include: { _count: { select: { registrations: true } } } });
  if (!event) return { error: "Evento não encontrado." };
  if (!event.registrationOpen || (event.startsAt && event.startsAt < new Date())) return { error: "As inscrições para este evento estão encerradas." };
  if (event.capacity && event._count.registrations >= event.capacity) return { error: "As vagas esgotaram. Fale com a gente pelo WhatsApp para entrar na lista de espera." };
  const name = get(form, "name", 120);
  const email = get(form, "email", 160).toLowerCase();
  const phone = get(form, "phone", 40);
  const err = validContact(name, email, phone);
  if (err) return { error: err };
  if (!email) return { error: "Informe seu e-mail: ele é usado para o certificado." };
  const exists = await db.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } } });
  if (exists) return { ok: true, message: "Você já estava inscrito(a) neste evento. Até lá!" };
  await db.eventRegistration.create({
    data: {
      eventId,
      name,
      email,
      phone: phone || null,
      role: get(form, "role", 60) || null,
      condo: get(form, "condo", 160) || null,
      city: get(form, "city", 80) || null,
      units: get(form, "units", 20) || null,
    },
  });
  revalidatePath("/admin", "layout");
  const when = event.startsAt
    ? new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full" }).format(event.startsAt)
    : null;
  await sendQuietly({
    to: email,
    subject: `Inscrição confirmada: ${event.title}`,
    text: [
      `Olá, ${name.split(" ")[0]}! Sua inscrição no *${event.title}* está confirmada.`,
      [when, event.venue, event.address, event.city].filter(Boolean).join(" · "),
      `Detalhes: ${siteUrl()}/eventos/${event.slug}`,
      "Guarde este e-mail: ele dá acesso ao certificado de participação.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  return { ok: true, message: `Inscrição confirmada no ${event.title}. Guarde este e-mail: ele dá acesso ao certificado.` };
}

/** Certificado: libera o link para quem foi marcado como presente. */
export async function findCertificate(eventId: string, _: PublicFormState, form: FormData): Promise<PublicFormState> {
  const email = get(form, "email", 160).toLowerCase();
  if (!EMAIL.test(email)) return { error: "Digite o e-mail usado na inscrição." };
  const reg = await db.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } }, include: { event: true } });
  if (!reg) return { error: "Não encontramos inscrição com este e-mail." };
  if (!reg.attended) return { error: "Sua presença ainda não foi confirmada pela equipe. Tente novamente mais tarde." };
  if (!reg.event.certificateUrl) return { error: "O certificado deste evento ainda não foi liberado." };
  return { ok: true, message: `Certificado de ${reg.name} liberado.`, link: reg.event.certificateUrl };
}
