import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** Cria convite ou link de nova senha. Devolve o token em texto (só existe nesse momento). */
export async function createAdminToken(opts: {
  kind: "convite" | "senha";
  email: string;
  name?: string;
  role?: string;
  userId?: string;
  createdBy?: string;
  hours?: number;
}) {
  const token = randomBytes(32).toString("base64url");
  await db.adminToken.create({
    data: {
      tokenHash: hashToken(token),
      kind: opts.kind,
      email: opts.email.toLowerCase(),
      name: opts.name,
      role: opts.role,
      userId: opts.userId,
      createdBy: opts.createdBy,
      expiresAt: new Date(Date.now() + (opts.hours ?? 72) * 3600_000),
    },
  });
  return token;
}

export async function findValidToken(token: string) {
  if (!token || token.length < 20) return null;
  const row = await db.adminToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  return row;
}

export { siteUrl } from "./site-url";
