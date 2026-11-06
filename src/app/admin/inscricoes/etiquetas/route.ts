import { registrationWhere } from "@/admin/registrations";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

const h = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Etiquetas no formato do painel antigo (90 × 29 mm): QR fixo com o contato da Ao Síndico, nome, condomínio, e-mail e telefone. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !can(user.role, "agenda")) return new Response("Não autorizado", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");
  // em massa só com evento escolhido, para ninguém mandar 3 mil etiquetas para a impressora sem querer
  if (!id && !sp.get("evento")) return new Response("Escolha um evento para imprimir as etiquetas.", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  const where = id ? { id } : registrationWhere({ evento: sp.get("evento"), tipo: sp.get("tipo"), q: sp.get("q") });
  const regs = await db.eventRegistration.findMany({ where, orderBy: { name: "asc" } });
  await db.eventRegistration.updateMany({ where, data: { labelCount: { increment: 1 } } });
  const labels = regs
    .map((r) => `<section class="label"><img src="/legacy/etiqueta-qr.png" alt=""><div><strong>${h(r.name)}</strong><p>${h(r.condo)}</p><p>${h(r.email)}</p><p>${r.phone ? `Telefone : ${h(r.phone)}` : ""}</p></div></section>`)
    .join("");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Etiquetas (${regs.length})</title><style>
@page{size:90mm 29mm;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#000;background:#fff}
.label{display:flex;align-items:center;gap:2mm;width:90mm;height:29mm;padding:0 2mm 0 4mm;overflow:hidden;break-after:page}
.label img{width:27mm;height:27mm;flex:none;image-rendering:pixelated}
.label div{min-width:0;display:grid;gap:1.6mm}
.label strong{font-size:12pt;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.label p{margin:0;font-size:9pt;min-height:1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media screen{body{padding:16px;background:#eee}.label{background:#fff;margin:0 auto 10px;box-shadow:0 1px 4px rgba(0,0,0,.25)}}
</style></head><body>${labels || "<p>Nenhuma inscrição.</p>"}<script>addEventListener("load",function(){print()})</script></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
