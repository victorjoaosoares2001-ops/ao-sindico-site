import Link from "next/link";
import { acceptToken } from "@/admin/actions";
import { Logo } from "@/components/Logo";
import { findValidToken } from "@/lib/tokens";
import { ROLES } from "@/lib/permissions";
import { AcceptForm } from "./AcceptForm";

export const metadata = { title: "Criar acesso", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await findValidToken(token);
  if (!row) {
    return (
      <div className="login">
        <div className="login__card">
          <Logo tone="light" />
          <h1>Link expirado</h1>
          <p>Este link já foi usado ou passou do prazo. Peça um novo à administração do portal.</p>
          <Link href="/admin/login" className="btn btn--yellow btn--block">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }
  const isInvite = row.kind === "convite";
  return (
    <div className="login">
      <AcceptForm
        action={acceptToken.bind(null, token)}
        isInvite={isInvite}
        email={row.email}
        name={row.name ?? ""}
        roleLabel={row.role ? (ROLES[row.role as keyof typeof ROLES] ?? row.role) : ""}
      />
    </div>
  );
}
