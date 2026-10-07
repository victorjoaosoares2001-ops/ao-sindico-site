import { NextResponse, type NextRequest } from "next/server";

// Barreira rápida: sem cookie de sessão, vai para o login.
// A assinatura do cookie é conferida no servidor (requireAdmin) em cada página e ação.
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!req.cookies.get("as_session")) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
