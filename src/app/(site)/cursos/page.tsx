import type { Metadata } from "next";
import { AgendaList } from "@/components/site/AgendaPages";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Cursos para síndicos", description: "Cursos e capacitações para síndicos, conselheiros e gestores de condomínios." };

export default async function CoursesPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.course.findMany({ where: { published: true, OR: [{ startsAt: { gte: now } }, { startsAt: null }] }, orderBy: { startsAt: "asc" } }),
    db.course.findMany({ where: { published: true, startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take: 9 }),
  ]);
  return <AgendaList kind="curso" upcoming={upcoming} past={past} />;
}
