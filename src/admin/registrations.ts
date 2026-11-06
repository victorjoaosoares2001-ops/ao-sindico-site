import type { Prisma } from "@prisma/client";

/** Filtros da lista de inscrições: valem para a tela, a exportação e as etiquetas. */
export function registrationWhere(sp: { evento?: string | null; tipo?: string | null; q?: string | null }): Prisma.EventRegistrationWhereInput {
  const q = sp.q?.trim();
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    ...(sp.evento ? { eventId: sp.evento } : {}),
    ...(sp.tipo ? { role: { startsWith: sp.tipo } } : {}), // "Síndico" (antigas) também pega "Síndico(a)" (site novo)
    ...(q ? { OR: [{ name: contains }, { email: contains }, { phone: contains }, { condo: contains }] } : {}),
  };
}
