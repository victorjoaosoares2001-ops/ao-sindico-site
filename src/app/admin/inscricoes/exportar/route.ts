import { registrationWhere } from "@/admin/registrations";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { can } from "@/lib/permissions";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // evita fórmulas no Excel e escapa aspas
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "agenda")) return new Response("Não autorizado", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const regs = await db.eventRegistration.findMany({
    where: registrationWhere({ evento: sp.get("evento"), tipo: sp.get("tipo"), q: sp.get("q") }),
    orderBy: { createdAt: "desc" },
    include: { event: { select: { title: true } } },
  });
  const header = ["Nº", "Nome", "E-mail", "Telefone", "Condomínio", "Tipo", "Evento", "Etiquetas geradas", "Presente", "Inscrito em"];
  const lines = regs.map((r) => [r.legacyId ?? "", r.name, r.email, r.phone, r.condo, r.role, r.event.title, r.labelCount, r.attended ? "sim" : "não", formatDateTime(r.createdAt)].map(esc).join(";"));
  return new Response("﻿" + [header.map(esc).join(";"), ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="inscritos.csv"', "Cache-Control": "no-store" },
  });
}
