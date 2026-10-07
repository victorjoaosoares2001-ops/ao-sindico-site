import { changePassword, createResetLink, inviteMember, revokeToken, updateMember } from "@/admin/actions";
import { ConfirmButton } from "@/components/admin/Buttons";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { InviteForm, MemberForm } from "@/components/admin/TeamForms";
import { Icon } from "@/components/Icon";
import { requireAdmin, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { ROLES } from "@/lib/permissions";

export const metadata = { title: "Equipe e acessos" };

export default async function TeamPage() {
  const me = await requireAdmin("equipe");
  const [users, invites, helpRequests] = await Promise.all([
    db.adminUser.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] }),
    db.adminToken.findMany({ where: { usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
    db.auditLog.findMany({ where: { action: "pediu-senha", createdAt: { gt: new Date(Date.now() - 7 * 86400_000) } }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const canOwner = me.role === "dono";

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Equipe e acessos</h1>
          <p>Cada pessoa tem seu acesso e vê só o que o perfil dela permite. Para entrar pela primeira vez, ela recebe um convite.</p>
        </div>
      </div>

      {helpRequests.length > 0 && (
        <div className="flash" style={{ background: "var(--yellow-soft)", color: "#6b4b00" }}>
          <Icon name="bell" /> Pedidos de ajuda com senha: {helpRequests.map((h) => `${h.label} (${formatDateTime(h.createdAt)})`).join(" · ")} — gere um link abaixo.
        </div>
      )}

      <div className="dash-grid">
        <section className="panel">
          {users.map((u) => (
            <div key={u.id} className="row-item" style={{ gridTemplateColumns: "48px minmax(0,1fr)", alignItems: "start" }}>
              <span className="row-thumb">
                <Icon name="users" />
              </span>
              <div className="row-main" style={{ display: "grid", gap: 10 }}>
                <div>
                  <strong style={{ opacity: u.active ? 1 : 0.5 }}>
                    {u.name} {u.id === me.id && <span className="hint">(você)</span>}
                  </strong>
                  <div className="row-meta">
                    <span>{u.email}</span>
                    <span>
                      Perfil: <em>{ROLES[u.role as keyof typeof ROLES] ?? u.role}</em>
                    </span>
                    {!u.active && <span style={{ color: "var(--magenta)" }}>Desativado</span>}
                    <span>Último acesso: {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "nunca"}</span>
                  </div>
                </div>
                <MemberForm
                  action={updateMember.bind(null, u.id)}
                  resetAction={createResetLink.bind(null, u.id)}
                  role={u.role}
                  active={u.active}
                  isMe={u.id === me.id}
                  canOwner={canOwner}
                />
              </div>
            </div>
          ))}
        </section>

        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <section className="panel panel__pad">
            <div className="panel__title">Convidar pessoa</div>
            <InviteForm action={inviteMember} canOwner={canOwner} />
          </section>
          {invites.length > 0 && (
            <section className="panel panel__pad">
              <div className="panel__title">Convites e links ativos</div>
              <div className="mini-list">
                {invites.map((t) => (
                  <div key={t.id} className="mini-item">
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong>{t.kind === "convite" ? `Convite · ${t.name ?? t.email ?? "dona"}` : `Nova senha · ${t.email}`}</strong>
                      <span className="hint">
                        {t.role ? `${ROLES[t.role as keyof typeof ROLES] ?? t.role} · ` : ""}vale até {formatDate(t.expiresAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                    <form action={revokeToken.bind(null, t.id)}>
                      <ConfirmButton message="Cancelar este link?" className="btn btn--sm btn--ghost">
                        Cancelar
                      </ConfirmButton>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}
          <MyPassword />
        </div>
      </div>
    </>
  );
}

async function MyPassword() {
  const me = await getCurrentUser();
  if (!me) return null;
  return (
    <section className="panel panel__pad">
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
  );
}
