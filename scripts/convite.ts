/**
 * Gera um convite de acesso ao painel (uso único, 72h) direto no banco.
 * Útil quando ninguém consegue entrar (ex.: dona perdeu o acesso).
 *   npm run admin:convite -- email@exemplo.com "Nome" dono
 * Perfis: dono | admin | comercial | editor
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

const [email, name, role = "editor"] = process.argv.slice(2);
if (!email || !name || !["dono", "admin", "comercial", "editor"].includes(role)) {
  console.error('Uso: npm run admin:convite -- email@exemplo.com "Nome" dono|admin|comercial|editor');
  process.exit(1);
}
const db = new PrismaClient();
const token = randomBytes(32).toString("base64url");
await db.adminToken.create({
  data: {
    tokenHash: createHash("sha256").update(token).digest("hex"),
    kind: "convite",
    email: email.toLowerCase(),
    name,
    role,
    createdBy: "Linha de comando",
    expiresAt: new Date(Date.now() + 72 * 3600_000),
  },
});
const base = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
console.log(`Convite para ${name} (${role}), uso único, 72h:\n${base}/admin/convite/${token}`);
await db.$disconnect();
