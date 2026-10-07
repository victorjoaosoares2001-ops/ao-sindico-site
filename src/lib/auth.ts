import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const SESSION_COOKIE = "as_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET não configurado (.env)");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const [userId, exp, sig] = token.split(".");
  if (!userId || !exp || !sig) return null;
  const expected = Buffer.from(sign(`${userId}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return userId;
}

export async function setSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
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

export async function getCurrentUser() {
  const userId = readToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return db.adminUser.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
}

/** Use no início de toda página e ação do painel. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}
