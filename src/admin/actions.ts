"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAction } from "@/lib/audit";
import { checkAdmin, clearSession, getCurrentUser, requireAdmin, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { isRole, ROLES } from "@/lib/permissions";
import { SETTING_GROUPS } from "@/lib/settings";
import { createAdminToken, findValidToken } from "@/lib/tokens";
import { siteUrl } from "@/lib/site-url";
import { saveUpload } from "@/lib/upload";
import { emailConfigured, sendEmail, sendQuietly } from "@/lib/email";
import { buildQuoteText } from "./quote-text";
import { delegate, fromInputDate } from "./data";
import { getResource, type ResourceDef } from "./resources";

export type FormState = { error?: string; ok?: string; link?: string };

const NO_PERMISSION: FormState = { error: "Você não tem permissão para esta ação. Fale com a administração." };

function refreshSite() {
  revalidatePath("/", "layout");
}

let DUMMY_HASH: string | undefined;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

// ---------- Login e acesso ----------

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.adminUser.findUnique({ where: { email } });
  const generic = { error: "E-mail ou senha incorretos." };
  if (!user || !user.active) {
    await bcrypt.compare(password, (DUMMY_HASH ??= await bcrypt.hash("tempo-constante", 10))); // mesmo tempo de resposta
    return generic;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `Muitas tentativas. Tente de novo em alguns minutos ou peça um link de nova senha.` };
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    const fails = user.failedLogins + 1;
    await db.adminUser.update({
      where: { id: user.id },
      data: { failedLogins: fails >= MAX_FAILS ? 0 : fails, lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null },
    });
    return generic;
  }
  await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await setSession(user);
  await logAction(user, "entrou", "equipe", user.id, user.name);
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}

/** “Esqueci a senha”: avisa a administração no histórico. Resposta é sempre a mesma. */
export async function requestPasswordHelp(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const user = await db.adminUser.findUnique({ where: { email } });
  if (user?.active) await logAction(user, "pediu-senha", "equipe", user.id, `${user.name} pediu um link de nova senha`);
  return { ok: "Pedido registrado. A administração vai te enviar um link para criar uma nova senha." };
}

/** Aceitar convite ou criar nova senha pelo link (uso único). */
export async function acceptToken(token: string, _: FormState, form: FormData): Promise<FormState> {
  const row = await findValidToken(token);
  if (!row) return { error: "Este link expirou ou já foi usado. Peça um novo à administração." };
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 10) return { error: "A senha precisa ter pelo menos 10 caracteres." };
  if (password !== confirm) return { error: "As senhas não conferem." };
  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  if (row.kind === "convite") {
    const name = String(form.get("name") ?? row.name ?? "").trim();
    const email = String(form.get("email") ?? row.email).trim().toLowerCase() || row.email;
    if (!name) return { error: "Informe seu nome." };
    if (!email.includes("@")) return { error: "Informe um e-mail válido." };
    const existing = await db.adminUser.findUnique({ where: { email } });
    if (existing) return { error: "Já existe um acesso com este e-mail. Use “Entrar”." };
    user = await db.adminUser.create({ data: { name, email, role: row.role && isRole(row.role) ? row.role : "editor", passwordHash } });
  } else {
    if (!row.userId) return { error: "Link inválido." };
    user = await db.adminUser.update({
      where: { id: row.userId },
      data: { passwordHash, sessionVersion: { increment: 1 }, failedLogins: 0, lockedUntil: null, active: true },
    });
  }
  await db.adminToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  await logAction(user, row.kind === "convite" ? "aceitou-convite" : "nova-senha", "equipe", user.id, user.name);
  await setSession(user);
  redirect("/admin");
}

// ---------- Cadastros genéricos ----------

async function uniqueSlug(def: ResourceDef, base: string, id: string | null) {
  const root = slugify(base) || slugify(def.singular);
  let candidate = root;
  for (let n = 2; ; n++) {
    const clash = await delegate(def.model).findFirst({ where: { slug: candidate, ...(id ? { NOT: { id } } : {}) } });
    if (!clash) return candidate;
    candidate = `${root}-${n}`;
  }
}

async function readFields(def: ResourceDef, form: FormData, id: string | null) {
  const data: Record<string, unknown> = {};
  for (const f of def.fields) {
    const raw = form.get(f.name);
    const str = typeof raw === "string" ? raw.trim() : "";
    switch (f.type) {
      case "bool":
        data[f.name] = raw === "on";
        break;
      case "number":
      case "rating":
        data[f.name] = Number.parseInt(str || "0", 10) || 0;
        if (f.type === "rating") data[f.name] = Math.min(5, Math.max(1, data[f.name] as number));
        break;
      case "date":
      case "datetime":
        data[f.name] = fromInputDate(str, f.type === "datetime");
        if (f.name === "publishedAt" && !data[f.name]) data[f.name] = new Date();
        break;
      case "image": {
        const file = form.get(`${f.name}__file`);
        if (form.get(`${f.name}__remove`) === "on") data[f.name] = null;
        else if (file instanceof File && file.size > 0) data[f.name] = await saveUpload(file);
        else data[f.name] = str || null;
        break;
      }
      case "relation":
        data[f.name] = str || null;
        break;
      case "relationMany": {
        const ids = form.getAll(f.name).map(String).filter(Boolean);
        data[f.name] = id ? { set: ids.map((x) => ({ id: x })) } : { connect: ids.map((x) => ({ id: x })) };
        break;
      }
      case "slug":
        break;
      case "url":
        if (str && !/^(https?:\/\/|\/|mailto:|tel:)/i.test(str)) data[f.name] = `https://${str}`;
        else data[f.name] = str || null;
        break;
      default:
        data[f.name] = str || null;
    }
    if (f.required && (data[f.name] === null || data[f.name] === "")) {
      throw new Error(`Preencha o campo “${f.label}”.`);
    }
  }
  if (def.fields.some((f) => f.type === "slug")) {
    const typed = String(form.get("slug") ?? "").trim();
    data.slug = await uniqueSlug(def, typed || String(data[def.slugFrom ?? def.titleField] ?? ""), id);
  }
  // Tira-Dúvidas: registrar quando foi respondida
  if (def.model === "question" && data.answer && data.published) data.answeredAt = new Date();
  // datas coerentes em anúncios
  if (def.model === "campaign" && data.startsAt && data.endsAt && (data.endsAt as Date) < (data.startsAt as Date)) {
    throw new Error("A data final do anúncio é anterior à data inicial.");
  }
  return data;
}

export async function saveResource(key: string, id: string | null, _: FormState, form: FormData): Promise<FormState> {
  const def = getResource(key);
  if (!def) return { error: "Cadastro desconhecido." };
  const user = await checkAdmin(def.module);
  if (!user) return NO_PERMISSION;
  let savedId = id;
  let label = "";
  try {
    const data = await readFields(def, form, id);
    const row = id ? await delegate(def.model).update({ where: { id }, data }) : await delegate(def.model).create({ data });
    savedId = row.id;
    label = String(row[def.titleField] ?? "");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  await logAction(user, id ? "editou" : "criou", key, savedId, label);
  refreshSite();
  const back = String(form.get("__back") ?? "");
  if (back.startsWith("/admin/")) redirect(`${back}${back.includes("?") ? "&" : "?"}ok=salvo`);
  const next = form.get("__next") === "novo" ? `/admin/${key}/novo?ok=1` : `/admin/${key}?ok=salvo`;
  redirect(next);
}

export async function deleteResource(key: string, id: string) {
  const def = getResource(key);
  if (!def) return;
  const user = await requireAdmin(def.module);
  const row = await delegate(def.model).findUnique({ where: { id } });
  await delegate(def.model).delete({ where: { id } });
  await logAction(user, "removeu", key, id, row ? String(row[def.titleField] ?? "") : null);
  refreshSite();
  redirect(`/admin/${key}?ok=removido`);
}

export async function togglePublished(key: string, id: string, value: boolean) {
  const def = getResource(key);
  if (!def?.publishField) return;
  const user = await requireAdmin(def.module);
  const data: Record<string, unknown> = { [def.publishField]: value };
  if (def.model === "question") data.status = value ? "publicada" : "pendente";
  const row = await delegate(def.model).update({ where: { id }, data });
  await logAction(user, value ? "publicou" : "ocultou", key, id, String(row[def.titleField] ?? ""));
  refreshSite();
  revalidatePath(`/admin/${key}`);
}

/** Aprovação rápida de avaliações. */
export async function setReviewStatus(id: string, status: "aprovada" | "rejeitada") {
  const user = await requireAdmin("comercial");
  const r = await db.review.update({ where: { id }, data: { status }, include: { supplier: { select: { name: true } } } });
  await logAction(user, status === "aprovada" ? "publicou" : "ocultou", "avaliacoes", id, `${r.name} → ${r.supplier.name}`);
  refreshSite();
  revalidatePath("/admin", "layout");
}

// ---------- Inscrições em eventos ----------

export async function toggleAttendance(eventId: string, registrationId: string, attended: boolean) {
  await requireAdmin("agenda");
  await db.eventRegistration.update({ where: { id: registrationId }, data: { attended } });
  revalidatePath(`/admin/eventos/${eventId}`);
}

export async function deleteRegistration(eventId: string, registrationId: string) {
  const user = await requireAdmin("agenda");
  const r = await db.eventRegistration.delete({ where: { id: registrationId } });
  await logAction(user, "removeu", "inscricoes", eventId, `${r.name} (${r.email})`);
  revalidatePath(`/admin/eventos/${eventId}`);
}

// ---------- Textos do site ----------

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  const user = await checkAdmin("site");
  if (!user) return NO_PERMISSION;
  try {
    const rows: { key: string; value: string }[] = [];
    for (const group of SETTING_GROUPS) {
      for (const field of group.fields) {
        let value = String(form.get(field.key) ?? "").trim();
        if ("type" in field && field.type === "image") {
          const file = form.get(`${field.key}__file`);
          if (form.get(`${field.key}__remove`) === "on") value = "";
          else if (file instanceof File && file.size > 0) value = await saveUpload(file);
        }
        rows.push({ key: field.key, value });
      }
    }
    await db.$transaction(rows.map((r) => db.siteSetting.upsert({ where: { key: r.key }, create: r, update: { value: r.value } })));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  await logAction(user, "editou", "textos", null, "Textos do site");
  refreshSite();
  return { ok: "Conteúdo atualizado. As mudanças já estão no site." };
}

// ---------- Mensagens / orçamentos ----------

export async function updateMessage(id: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await checkAdmin("mensagens");
  if (!user) return NO_PERMISSION;
  const status = String(form.get("status") ?? "novo");
  const notes = String(form.get("notes") ?? "").trim() || null;
  const assignedTo = String(form.get("assignedTo") ?? "").trim() || null;
  const supplierIds = form.getAll("suppliers").map(String).filter(Boolean);
  const before = await db.message.findUnique({ where: { id }, include: { suppliers: true } });
  if (!before) return { error: "Mensagem não encontrada." };
  await db.$transaction([
    db.message.update({ where: { id }, data: { status, notes, assignedTo } }),
    db.quoteSupplier.deleteMany({ where: { messageId: id, supplierId: { notIn: supplierIds } } }),
    ...supplierIds
      .filter((s) => !before.suppliers.some((c) => c.supplierId === s))
      .map((supplierId) => db.quoteSupplier.create({ data: { messageId: id, supplierId } })),
  ]);
  const changes: string[] = [];
  if (before.status !== status) changes.push(`situação: ${status}`);
  if ((before.notes ?? "") !== (notes ?? "")) changes.push("observações");
  if ((before.assignedTo ?? "") !== (assignedTo ?? "")) changes.push(`responsável: ${assignedTo ?? "ninguém"}`);
  const added = supplierIds.length - before.suppliers.filter((s) => supplierIds.includes(s.supplierId)).length;
  const removed = before.suppliers.length - (supplierIds.length - added);
  if (added) changes.push(`+${added} empresa(s)`);
  if (removed) changes.push(`-${removed} empresa(s)`);
  if (changes.length) await logAction(user, "editou", "mensagens", id, changes.join(" · "));
  revalidatePath("/admin", "layout");
  return { ok: "Alterações salvas." };
}

export async function setMessageStatus(id: string, status: string) {
  const user = await requireAdmin("mensagens");
  await db.message.update({ where: { id }, data: { status } });
  await logAction(user, "status", "mensagens", id, status);
  revalidatePath("/admin", "layout");
}

export async function markSupplierSent(messageId: string, supplierId: string, sent: boolean) {
  const user = await requireAdmin("mensagens");
  const link = await db.quoteSupplier.update({
    where: { messageId_supplierId: { messageId, supplierId } },
    data: { sentAt: sent ? new Date() : null },
    include: { supplier: { select: { name: true } } },
  });
  const message = await db.message.findUnique({ where: { id: messageId } });
  if (sent && message?.status === "novo") await db.message.update({ where: { id: messageId }, data: { status: "andamento" } });
  await logAction(user, sent ? "encaminhou" : "desmarcou-envio", "mensagens", messageId, link.supplier.name);
  revalidatePath("/admin", "layout");
}

/** Envia o pedido à empresa pelo e-mail do sistema, marca como enviado e registra o contato. */
export async function emailQuoteToSupplier(messageId: string, supplierId: string, _: FormState): Promise<FormState> {
  const user = await checkAdmin("mensagens");
  if (!user) return NO_PERMISSION;
  if (!emailConfigured()) return { error: "Envio de e-mail não configurado na hospedagem. Use os botões de WhatsApp ou E-mail." };
  const [m, s] = await Promise.all([db.message.findUnique({ where: { id: messageId } }), db.supplier.findUnique({ where: { id: supplierId } })]);
  if (!m || !s) return { error: "Pedido ou empresa não encontrados." };
  if (!s.email) return { error: "Esta empresa não tem e-mail cadastrado." };
  const r = await sendEmail({ to: s.email, subject: `Pedido de orçamento — ${m.category ?? "Ao Síndico"}`, text: buildQuoteText(m, s.name), replyTo: m.email });
  if (!r.sent) return { error: `Não foi possível enviar: ${r.error}` };
  await db.quoteSupplier.update({ where: { messageId_supplierId: { messageId, supplierId } }, data: { sentAt: new Date() } });
  await db.quoteContact.create({ data: { messageId, supplierId, channel: "email", note: `Pedido enviado por e-mail para ${s.email}`, userName: user.name } });
  if (m.status === "novo") await db.message.update({ where: { id: messageId }, data: { status: "andamento" } });
  await logAction(user, "encaminhou", "mensagens", messageId, `${s.name} (e-mail)`);
  revalidatePath(`/admin/mensagens/${messageId}`);
  return { ok: `Enviado para ${s.email}.` };
}

/** Registra um contato feito (com o síndico ou com uma empresa). */
export async function addContact(messageId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await checkAdmin("mensagens");
  if (!user) return NO_PERMISSION;
  const channel = String(form.get("channel") ?? "whatsapp");
  const supplierId = String(form.get("supplierId") ?? "") || null;
  const note = String(form.get("note") ?? "").trim() || null;
  if (!note && !supplierId) return { error: "Escreva o que foi conversado ou escolha a empresa." };
  await db.quoteContact.create({ data: { messageId, supplierId, channel, note, userName: user.name } });
  const msg = await db.message.findUnique({ where: { id: messageId } });
  if (msg?.status === "novo") await db.message.update({ where: { id: messageId }, data: { status: "andamento" } });
  await logAction(user, "contato", "mensagens", messageId, `${channel}${note ? `: ${note}` : ""}`);
  revalidatePath(`/admin/mensagens/${messageId}`);
  return { ok: "Contato registrado." };
}

export async function deleteMessage(id: string) {
  const user = await requireAdmin("mensagens");
  const m = await db.message.delete({ where: { id } });
  await logAction(user, "removeu", "mensagens", id, m.name);
  revalidatePath("/admin", "layout");
  redirect("/admin/mensagens?ok=removido");
}

// ---------- Equipe ----------

export async function inviteMember(_: FormState, form: FormData): Promise<FormState> {
  const user = await checkAdmin("equipe");
  if (!user) return NO_PERMISSION;
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const role = String(form.get("role") ?? "editor");
  if (!name || !email.includes("@")) return { error: "Informe nome e e-mail válidos." };
  if (!isRole(role)) return { error: "Perfil inválido." };
  if (role === "dono" && user.role !== "dono") return { error: "Só a dona/o dono pode convidar outro dono." };
  if (await db.adminUser.findUnique({ where: { email } })) return { error: "Já existe um acesso com esse e-mail." };
  const token = await createAdminToken({ kind: "convite", email, name, role, createdBy: user.name, hours: 72 });
  await logAction(user, "convidou", "equipe", null, `${name} (${ROLES[role]})`);
  revalidatePath("/admin/equipe");
  const link = `${siteUrl()}/admin/convite/${token}`;
  const mail = await sendQuietly({
    to: email,
    subject: "Seu acesso ao painel Ao Síndico",
    text: `Olá, ${name.split(" ")[0]}!\n\n${user.name} convidou você para o painel do portal Ao Síndico (perfil ${ROLES[role]}).\n\nCrie sua senha por este link (vale 72 horas e só pode ser usado uma vez):\n${link}`,
  });
  return {
    ok: mail.sent ? `Convite enviado por e-mail para ${email}. Se preferir, envie também o link abaixo (vale 72 horas, uso único).` : `Convite criado para ${name}. Envie o link abaixo (vale 72 horas, uso único).`,
    link,
  };
}

export async function createResetLink(userId: string, _: FormState): Promise<FormState> {
  const user = await checkAdmin("equipe");
  if (!user) return NO_PERMISSION;
  const target = await db.adminUser.findUnique({ where: { id: userId } });
  if (!target) return { error: "Pessoa não encontrada." };
  if (target.role === "dono" && user.role !== "dono") return { error: "Só a dona/o dono pode gerar link para outro dono." };
  const token = await createAdminToken({ kind: "senha", email: target.email, userId: target.id, createdBy: user.name, hours: 24 });
  await logAction(user, "senha", "equipe", target.id, target.name);
  const link = `${siteUrl()}/admin/convite/${token}`;
  const mail = await sendQuietly({
    to: target.email,
    subject: "Nova senha do painel Ao Síndico",
    text: `Olá, ${target.name.split(" ")[0]}!\n\nUse este link para criar uma nova senha no painel do Ao Síndico (vale 24 horas e só pode ser usado uma vez):\n${link}\n\nSe você não pediu, ignore este e-mail.`,
  });
  return { ok: `${mail.sent ? `Link enviado por e-mail para ${target.email}. ` : ""}Link de nova senha para ${target.name} (vale 24 horas, uso único):`, link };
}

export async function updateMember(userId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await checkAdmin("equipe");
  if (!user) return NO_PERMISSION;
  const target = await db.adminUser.findUnique({ where: { id: userId } });
  if (!target) return { error: "Pessoa não encontrada." };
  const role = String(form.get("role") ?? target.role);
  const active = form.get("active") === "on";
  if (!isRole(role)) return { error: "Perfil inválido." };
  if ((role === "dono" || target.role === "dono") && user.role !== "dono") return { error: "Só a dona/o dono altera esse acesso." };
  if (target.id === user.id && (!active || role !== target.role)) return { error: "Você não pode mudar o próprio perfil nem se desativar." };
  if (target.role === "dono" && role !== "dono") {
    const owners = await db.adminUser.count({ where: { role: "dono", active: true } });
    if (owners <= 1) return { error: "É preciso manter pelo menos uma dona/um dono ativo." };
  }
  await db.adminUser.update({
    where: { id: userId },
    data: { role, active, ...(active !== target.active || role !== target.role ? { sessionVersion: { increment: 1 } } : {}) },
  });
  await logAction(user, "perfil", "equipe", userId, `${target.name}: ${ROLES[role]}${active ? "" : " (desativado)"}`);
  revalidatePath("/admin/equipe");
  return { ok: "Acesso atualizado." };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const current = await getCurrentUser();
  if (!current) return NO_PERMISSION;
  const oldPassword = String(form.get("current") ?? "");
  const password = String(form.get("password") ?? "");
  const me = await db.adminUser.findUnique({ where: { id: current.id } });
  if (!me || !(await bcrypt.compare(oldPassword, me.passwordHash))) return { error: "A senha atual não confere." };
  if (password.length < 10) return { error: "A nova senha precisa ter pelo menos 10 caracteres." };
  const updated = await db.adminUser.update({
    where: { id: me.id },
    data: { passwordHash: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } },
  });
  await setSession(updated); // mantém esta sessão; derruba as outras
  await logAction(current, "nova-senha", "equipe", me.id, me.name);
  return { ok: "Senha alterada. Outras sessões abertas foram encerradas." };
}

export async function revokeToken(id: string) {
  const user = await requireAdmin("equipe");
  await db.adminToken.update({ where: { id }, data: { expiresAt: new Date() } });
  await logAction(user, "cancelou-convite", "equipe", id, null);
  revalidatePath("/admin/equipe");
}
