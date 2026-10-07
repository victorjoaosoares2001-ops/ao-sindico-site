import { changePassword } from "@/admin/actions";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { requireAdmin } from "@/lib/auth";
import { ROLES } from "@/lib/permissions";

export const metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const me = await requireAdmin();
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Minha conta</h1>
          <p>
            {me.name} · {me.email} · perfil {ROLES[me.role as keyof typeof ROLES] ?? me.role}
          </p>
        </div>
      </div>
      <section className="panel panel__pad" style={{ maxWidth: 520 }}>
        <div className="panel__title">Trocar minha senha</div>
        <SimpleForm action={changePassword} submit="Salvar nova senha" reset>
          <label className="field">
            <span>Senha atual</span>
            <input name="current" type="password" className="input" required autoComplete="current-password" />
          </label>
          <label className="field">
            <span>Nova senha (mín. 10 caracteres)</span>
            <input name="password" type="password" className="input" required minLength={10} autoComplete="new-password" />
          </label>
        </SimpleForm>
      </section>
    </>
  );
}
