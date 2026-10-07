import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm, SetupForm } from "./LoginForm";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  const firstRun = (await db.adminUser.count()) === 0;
  return <div className="login">{firstRun ? <SetupForm /> : <LoginForm />}</div>;
}
