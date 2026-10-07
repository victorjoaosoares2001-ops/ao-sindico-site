import { NextResponse, type NextRequest } from "next/server";

// Barreira rápida: sem cookie de sessão, vai para o login.
// A assinatura, a versão da sessão e a permissão são conferidas no servidor em cada página e ação.
const PUBLIC = ["/admin/login", "/admin/convite/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = PUBLIC.some((p) => pathname.startsWith(p))
    ? NextResponse.next()
    : req.cookies.get("as_session")
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/admin/login", req.url));
  // painel nunca é indexado nem vai para cache compartilhado
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer"); // links de convite não vazam por Referer
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
