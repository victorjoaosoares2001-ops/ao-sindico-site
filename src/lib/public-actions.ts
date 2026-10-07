"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";

export type PublicFormState = { ok?: boolean; error?: string; message?: string };

const get = (form: FormData, k: string) => String(form.get(k) ?? "").trim();

function isBot(form: FormData) {
  // campo invisível: pessoas não preenchem
  return get(form, "empresa_site") !== "";
}

function validContact(name: string, email: string, phone: string) {
  if (name.length < 2) return "Informe seu nome.";
  if (!email && !phone) return "Informe um e-mail ou telefone para retornarmos.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "E-mail inválido.";
  return null;
}

/** Pedido de orçamento do síndico → cai em Mensagens no painel. */
export async function submitQuote(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return { ok: true };
  const name = get(form, "name");
  const email = get(form, "email");
  const phone = get(form, "phone");
  const body = get(form, "body");
  const err = validContact(name, email, phone);
  if (err) return { error: err };
  if (body.length < 3) return { error: "Conte o que o condomínio precisa." };

  const supplierIds = form.getAll("suppliers").map(String).filter(Boolean).slice(0, 10);
  const valid = supplierIds.length
    ? await db.supplier.findMany({ where: { id: { in: supplierIds }, published: true }, select: { id: true } })
    : [];

  await db.message.create({
    data: {
      type: "orcamento",
      name,
      email: email || null,
      phone: phone || null,
      company: get(form, "company") || null,
      city: get(form, "city") || null,
      category: get(form, "category") || null,
      units: get(form, "units") || null,
      urgency: get(form, "urgency") || null,
      subject: get(form, "category") ? `Orçamento: ${get(form, "category")}` : "Pedido de orçamento",
      body,
      source: get(form, "source") || null,
      suppliers: { create: valid.map((s) => ({ supplierId: s.id, requested: true })) },
    },
  });
  revalidatePath("/admin", "layout");
  return {
    ok: true,
    message: "Pedido enviado! Nossa equipe vai encaminhar às empresas e você receberá os orçamentos em breve.",
  };
}

/** Empresa querendo anunciar ou contato geral. */
export async function submitContact(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return { ok: true };
  const name = get(form, "name");
  const email = get(form, "email");
  const phone = get(form, "phone");
  const err = validContact(name, email, phone);
  if (err) return { error: err };
  const type = get(form, "type") === "contato" ? "contato" : "anunciar";
  await db.message.create({
    data: {
      type,
      name,
      email: email || null,
      phone: phone || null,
      company: get(form, "company") || null,
      city: get(form, "city") || null,
      subject: get(form, "subject") || (type === "anunciar" ? "Quero anunciar" : "Contato pelo site"),
      body: get(form, "body") || null,
      source: get(form, "source") || null,
    },
  });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Mensagem recebida! Retornaremos em até 1 dia útil." };
}

export async function subscribe(_: PublicFormState, form: FormData): Promise<PublicFormState> {
  if (isBot(form)) return { ok: true };
  const email = get(form, "email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Digite um e-mail válido." };
  await db.subscriber.upsert({ where: { email }, create: { email, name: get(form, "name") || null }, update: {} });
  return { ok: true, message: "Pronto! Você vai receber nossas novidades." };
}
