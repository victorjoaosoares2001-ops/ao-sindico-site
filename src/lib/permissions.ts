/**
 * Perfis de acesso do painel. Cada módulo diz quais perfis podem usá-lo.
 * - dono: tudo, inclusive equipe e perfis
 * - admin: tudo, menos promover alguém a dono
 * - comercial: mensagens/orçamentos, fornecedores, anúncios, parceiros, avaliações
 * - editor: matérias, autores, seções, Tira-Dúvidas, vídeos, eventos e cursos
 */
export const ROLES = {
  dono: "Dona / dono",
  admin: "Administração",
  comercial: "Comercial",
  editor: "Conteúdo",
} as const;

export type Role = keyof typeof ROLES;

export type Module =
  | "mensagens"
  | "comercial"
  | "conteudo"
  | "agenda"
  | "site"
  | "equipe"
  | "historico";

const ACCESS: Record<Module, Role[]> = {
  mensagens: ["dono", "admin", "comercial"],
  comercial: ["dono", "admin", "comercial"],
  conteudo: ["dono", "admin", "editor"],
  agenda: ["dono", "admin", "editor", "comercial"],
  site: ["dono", "admin"],
  equipe: ["dono", "admin"],
  historico: ["dono", "admin"],
};

export function can(role: string | undefined, module: Module) {
  return !!role && (ACCESS[module] as string[]).includes(role);
}

export function isRole(r: string): r is Role {
  return r in ROLES;
}
