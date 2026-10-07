import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AgendaList } from "@/components/site/AgendaPages";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Eventos e Encontros de Síndicos", description: "Agenda de encontros, palestras e eventos para síndicos." };

export default async function EventsPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.event.findMany({ where: { published: true, OR: [{ startsAt: { gte: now } }, { startsAt: null }] }, orderBy: { startsAt: "asc" } }),
    db.event.findMany({ where: { published: true, startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take: 9 }),
  ]);
  if (upcoming.length + past.length === 0) notFound(); // sem eventos: seção oculta
  return <AgendaList kind="evento" upcoming={upcoming} past={past} />;
}
