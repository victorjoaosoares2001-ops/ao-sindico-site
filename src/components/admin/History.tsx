import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

const VERB: Record<string, string> = {
  criou: "criou",
  editou: "editou",
  removeu: "removeu",
  publicou: "publicou",
  ocultou: "tirou do site",
  status: "mudou a situação para",
  contato: "registrou contato",
  encaminhou: "encaminhou para",
  "desmarcou-envio": "desmarcou o envio para",
  entrou: "entrou no painel",
  convidou: "convidou",
  senha: "gerou link de nova senha para",
  "nova-senha": "definiu nova senha",
  "aceitou-convite": "aceitou o convite",
  "pediu-senha": "pediu ajuda com a senha",
  perfil: "alterou o acesso de",
  "cancelou-convite": "cancelou um convite",
};

export const verb = (a: string) => VERB[a] ?? a;

/** Histórico de um registro (ou geral, sem entityId). */
export async function History({ entity, entityId, take = 15 }: { entity?: string; entityId?: string; take?: number }) {
  const rows = await db.auditLog.findMany({
    where: { ...(entity ? { entity } : {}), ...(entityId ? { entityId } : {}) },
    orderBy: { createdAt: "desc" },
    take,
  });
  if (!rows.length) return <p className="hint">Nenhuma alteração registrada ainda.</p>;
  return (
    <ol className="timeline">
      {rows.map((r) => (
        <li key={r.id}>
          <span className="timeline__dot" />
          <div>
            <strong>{r.userName}</strong> {verb(r.action)} {r.label && <em>{r.label}</em>}
            <div className="hint">{formatDateTime(r.createdAt)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
