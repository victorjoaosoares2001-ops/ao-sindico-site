import { NextResponse, type NextRequest } from "next/server";

// Painel: sem cookie de sessão, vai para o login. A assinatura, a versão da sessão e a
// permissão são conferidas no servidor em cada página e ação.
const ADMIN_PUBLIC = ["/admin/login", "/admin/convite/"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const res = ADMIN_PUBLIC.some((p) => pathname.startsWith(p))
      ? NextResponse.next()
      : req.cookies.get("as_session")
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/admin/login", req.url));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("Referrer-Policy", "no-referrer"); // links de convite não vazam por Referer
    return res;
  }

  // Site público: informa o caminho ao layout para montar o <link rel="canonical">
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/|uploads/|anuncio/|icon\\.svg|favicon\\.ico|robots\\.txt|sitemap\\.xml).*)"],
};
