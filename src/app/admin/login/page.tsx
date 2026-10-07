import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm, SetupForm } from "./LoginForm";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (await getCurrentUser()) redirect("/admin");
  const { token } = await searchParams;
  // Tela de primeiro acesso só com token de provisionamento na URL e nenhum usuário criado.
  const canSetup = !!process.env.OWNER_SETUP_TOKEN && !!token && (await db.adminUser.count()) === 0;
  return <div className="login">{canSetup ? <SetupForm token={token!} /> : <LoginForm />}</div>;
}
