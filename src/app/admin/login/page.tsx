import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <div className="login">
      <LoginForm />
    </div>
  );
}
