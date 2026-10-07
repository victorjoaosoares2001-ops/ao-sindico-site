import { changePassword, createAdmin, deleteAdmin } from "@/admin/actions";
import { ConfirmButton } from "@/components/admin/Buttons";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Equipe" };

export default async function TeamPage() {
  const me = await requireAdmin();
  const users = await db.adminUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, createdAt: true } });
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Equipe e senha</h1>
          <p>Quem pode entrar no painel. Cada pessoa tem seu próprio acesso.</p>
        </div>
      </div>
      <div className="dash-grid">
        <section className="panel">
          {users.map((u) => (
            <div key={u.id} className="row-item">
              <span className="row-thumb">
                <Icon name="users" />
              </span>
              <div className="row-main">
                <strong>
                  {u.name} {u.id === me.id && <span className="hint">(você)</span>}
                </strong>
                <div className="row-meta">
                  {u.email} · desde {formatDate(u.createdAt, { month: "short", year: "numeric" })}
                </div>
              </div>
              <div className="row-actions">
                {u.id !== me.id && (
                  <form action={deleteAdmin.bind(null, u.id)}>
                    <ConfirmButton message={`Remover o acesso de ${u.name}?`} className="icon-btn icon-btn--danger" icon="trash" title="Remover acesso" />
                  </form>
                )}
              </div>
            </div>
          ))}
        </section>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <section className="panel panel__pad">
            <div className="panel__title">Adicionar pessoa</div>
            <SimpleForm action={createAdmin} submit="Criar acesso" reset>
              <label className="field">
                <span>Nome</span>
                <input name="name" className="input" required />
              </label>
              <label className="field">
                <span>E-mail</span>
                <input name="email" type="email" className="input" required />
              </label>
              <label className="field">
                <span>Senha inicial (mín. 8 caracteres)</span>
                <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
              </label>
            </SimpleForm>
          </section>
          <section className="panel panel__pad">
            <div className="panel__title">Trocar minha senha</div>
            <SimpleForm action={changePassword} submit="Salvar nova senha" reset>
              <label className="field">
                <span>Nova senha</span>
                <input name="password" type="password" className="input" required minLength={8} autoComplete="new-password" />
              </label>
            </SimpleForm>
          </section>
        </div>
      </div>
    </>
  );
}
