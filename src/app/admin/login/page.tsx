import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

/** Não existe cadastro público: acessos são criados por convite (ver /admin/equipe e prisma/data-steps.ts). */
export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <div className="login">
      <LoginForm />
    </div>
  );
}
