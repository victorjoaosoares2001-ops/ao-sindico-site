"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, requireAdmin, setSession } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { saveUpload } from "@/lib/upload";
import { SETTING_GROUPS } from "@/lib/settings";
import { delegate, fromInputDate } from "./data";
import { getResource, type ResourceDef } from "./resources";

export type FormState = { error?: string; ok?: string };

function refreshSite() {
  revalidatePath("/", "layout");
}

// ---------- Login ----------

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.adminUser.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos." };
  }
  await setSession(user.id);
  redirect("/admin");
}

/** Só funciona enquanto não existe nenhum acesso: cria o primeiro e já entra. */
export async function createFirstAdmin(_: FormState, form: FormData): Promise<FormState> {
  if ((await db.adminUser.count()) > 0) return { error: "O primeiro acesso já foi criado. Faça login." };
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email.includes("@")) return { error: "Informe nome e e-mail válidos." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  const user = await db.adminUser.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  await setSession(user.id);
  redirect("/admin");
}

export async function logout() {
  await clearSession();
  redirect("/admin/login");
}

// ---------- Cadastros genéricos ----------

async function uniqueSlug(def: ResourceDef, base: string, id: string | null) {
  const root = slugify(base) || def.singular;
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
        data[f.name] = Number.parseInt(str || "0", 10) || 0;
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
        break; // tratado abaixo
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
  return data;
}

export async function saveResource(key: string, id: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const def = getResource(key);
  if (!def) return { error: "Cadastro desconhecido." };
  let savedId = id;
  try {
    const data = await readFields(def, form, id);
    const row = id
      ? await delegate(def.model).update({ where: { id }, data })
      : await delegate(def.model).create({ data });
    savedId = row.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  refreshSite();
  const next = form.get("__next") === "novo" ? `/admin/${key}/novo?ok=1` : `/admin/${key}?ok=salvo`;
  redirect(savedId && form.get("__next") === "ficar" ? `/admin/${key}/${savedId}?ok=1` : next);
}

export async function deleteResource(key: string, id: string) {
  await requireAdmin();
  const def = getResource(key);
  if (!def) return;
  await delegate(def.model).delete({ where: { id } });
  refreshSite();
  redirect(`/admin/${key}?ok=removido`);
}

export async function togglePublished(key: string, id: string, published: boolean) {
  await requireAdmin();
  const def = getResource(key);
  if (!def) return;
  await delegate(def.model).update({ where: { id }, data: { published } });
  refreshSite();
  revalidatePath(`/admin/${key}`);
}

// ---------- Conteúdo do site ----------

export async function saveSettings(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
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
    // uma única transação: rápido e tudo-ou-nada
    await db.$transaction(rows.map((r) => db.siteSetting.upsert({ where: { key: r.key }, create: r, update: { value: r.value } })));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  refreshSite();
  return { ok: "Conteúdo atualizado. As mudanças já estão no site." };
}

// ---------- Mensagens ----------

export async function updateMessage(id: string, _: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const status = String(form.get("status") ?? "novo");
  const notes = String(form.get("notes") ?? "").trim() || null;
  const supplierIds = form.getAll("suppliers").map(String);
  const current = await db.quoteSupplier.findMany({ where: { messageId: id } });
  await db.$transaction([
    db.message.update({ where: { id }, data: { status, notes } }),
    db.quoteSupplier.deleteMany({ where: { messageId: id, supplierId: { notIn: supplierIds } } }),
    ...supplierIds
      .filter((s) => !current.some((c) => c.supplierId === s))
      .map((supplierId) => db.quoteSupplier.create({ data: { messageId: id, supplierId } })),
  ]);
  revalidatePath("/admin", "layout");
  return { ok: "Alterações salvas." };
}

export async function setMessageStatus(id: string, status: string) {
  await requireAdmin();
  await db.message.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

export async function markSupplierSent(messageId: string, supplierId: string, sent: boolean) {
  await requireAdmin();
  await db.quoteSupplier.update({
    where: { messageId_supplierId: { messageId, supplierId } },
    data: { sentAt: sent ? new Date() : null },
  });
  const message = await db.message.findUnique({ where: { id: messageId } });
  if (sent && message?.status === "novo") {
    await db.message.update({ where: { id: messageId }, data: { status: "andamento" } });
  }
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await db.message.delete({ where: { id } });
  revalidatePath("/admin", "layout");
  redirect("/admin/mensagens?ok=removido");
}

// ---------- Equipe ----------

export async function createAdmin(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email.includes("@")) return { error: "Informe nome e e-mail válidos." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (await db.adminUser.findUnique({ where: { email } })) return { error: "Já existe um acesso com esse e-mail." };
  await db.adminUser.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 10) } });
  revalidatePath("/admin/equipe");
  return { ok: `Acesso criado para ${name}.` };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  await db.adminUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  return { ok: "Senha alterada." };
}

export async function deleteAdmin(id: string) {
  const user = await requireAdmin();
  if (user.id === id) return;
  await db.adminUser.delete({ where: { id } });
  revalidatePath("/admin/equipe");
}
