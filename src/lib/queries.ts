import { db } from "./db";

export const supplierCardInclude = { categories: { select: { name: true, slug: true } } } as const;

export function activeCampaigns(placement: string, take = 6) {
  const now = new Date();
  return db.campaign.findMany({
    where: {
      published: true,
      placement,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    take,
  });
}

export function publishedCategories() {
  return db.category.findMany({ where: { published: true }, orderBy: [{ order: "asc" }, { name: "asc" }] });
}

/** Próximos eventos primeiro; se não houver, os mais recentes. */
export async function upcomingEvents(take = 3) {
  const now = new Date();
  const next = await db.event.findMany({ where: { published: true, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take });
  if (next.length >= take) return next;
  const past = await db.event.findMany({
    where: { published: true, OR: [{ startsAt: { lt: now } }, { startsAt: null }] },
    orderBy: { startsAt: "desc" },
    take: take - next.length,
  });
  return [...next, ...past];
}

export async function upcomingCourses(take = 3) {
  return db.course.findMany({ where: { published: true }, orderBy: [{ startsAt: "desc" }], take });
}
