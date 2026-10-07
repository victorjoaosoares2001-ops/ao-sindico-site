import "server-only";
import { db } from "./db";

export const ACTION_LABEL: Record<string, string> = {
  criou: "criou",
  editou: "editou",
  removeu: "removeu",
  publicou: "publicou",
  ocultou: "ocultou",
  entrou: "entrou no painel",
  status: "mudou a situação de",
  contato: "registrou contato em",
  convidou: "convidou",
  senha: "gerou link de nova senha para",
  perfil: "mudou o perfil de",
};

/** Registra no histórico. Nunca derruba a ação principal se falhar. */
export async function logAction(
  user: { id: string; name: string } | null,
  action: string,
  entity: string,
  entityId?: string | null,
  label?: string | null,
) {
  try {
    await db.auditLog.create({
      data: { userId: user?.id ?? null, userName: user?.name ?? "Sistema", action, entity, entityId: entityId ?? null, label: label?.slice(0, 200) ?? null },
    });
  } catch {
    /* histórico é complementar */
  }
}
