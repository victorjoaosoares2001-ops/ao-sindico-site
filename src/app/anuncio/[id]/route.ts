import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Clique em anúncio: conta e redireciona para o link da campanha. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.campaign.findUnique({ where: { id }, select: { link: true, published: true } });
  if (!c?.link || !c.published) return NextResponse.redirect(new URL("/", req.url));
  await db.campaign.update({ where: { id }, data: { clicks: { increment: 1 } } }).catch(() => {});
  const target = c.link.startsWith("/") ? new URL(c.link, req.url) : c.link;
  return NextResponse.redirect(target, 302);
}
