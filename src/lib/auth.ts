import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { can, type Module } from "./permissions";

export const SESSION_COOKIE = "as_session";
const MAX_AGE = 60 * 60 * 12; // 12 horas

/**
 * Chave das sessões. Use AUTH_SECRET quando definido; sem ele, deriva da
 * DATABASE_URL (secreta, criada pela hospedagem).
 */
function secret() {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Defina AUTH_SECRET ou DATABASE_URL");
  return createHash("sha256").update(`ao-sindico-session:${url}`).digest("hex");
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

// token: userId.versão.expiração.assinatura — trocar a senha muda a versão e derruba sessões antigas
function createSessionToken(userId: string, version: number) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${version}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined) {
  if (!token) return null;
  const [userId, version, exp, sig] = token.split(".");
  if (!userId || !version || !exp || !sig) return null;
  const expected = Buffer.from(sign(`${userId}.${version}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return { userId, version: Number(version) };
}

export async function setSession(user: { id: string; sessionVersion: number }) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(user.id, user.sessionVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type CurrentUser = { id: string; name: string; email: string; role: string };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const t = readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!t) return null;
  const user = await db.adminUser.findUnique({
    where: { id: t.userId },
    select: { id: true, name: true, email: true, role: true, active: true, sessionVersion: true },
  });
  if (!user || !user.active || user.sessionVersion !== t.version) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** Use no início de toda página e ação do painel. Com módulo, confere a permissão. */
export async function requireAdmin(module?: Module): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (module && !can(user.role, module)) redirect("/admin?sem-permissao=1");
  return user;
}

/** Para ações: devolve erro em vez de redirecionar. */
export async function checkAdmin(module?: Module): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (module && !can(user.role, module)) return null;
  return user;
}
