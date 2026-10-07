import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // evita fórmulas no Excel e escapa aspas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "agenda")) return new Response("Não autorizado", { status: 401 });
  const { id } = await params;
  const event = await db.event.findUnique({ where: { id }, include: { registrations: { orderBy: { createdAt: "asc" } } } });
  if (!event) return new Response("Não encontrado", { status: 404 });
  const header = ["Nome", "E-mail", "Telefone", "Função", "Condomínio", "Cidade", "Unidades", "Presente", "Inscrito em"];
  const lines = event.registrations.map((r) =>
    [r.name, r.email, r.phone, r.role, r.condo, r.city, r.units, r.attended ? "sim" : "não", r.createdAt.toISOString()].map(esc).join(";"),
  );
  const csv = "﻿" + [header.map(esc).join(";"), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscricoes-${event.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
