import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { AgendaList } from "@/components/site/AgendaPages";
import { VideoPlayer } from "@/components/site/Forms";
import { db } from "@/lib/db";
import { youtubeId } from "@/lib/queries";

export const metadata: Metadata = { title: "Eventos e Encontros de Síndicos", description: "Agenda de encontros, palestras e eventos para síndicos." };

export default async function EventsPage() {
  const now = new Date();
  const [upcoming, past, videos] = await Promise.all([
    db.event.findMany({ where: { published: true, OR: [{ startsAt: { gte: now } }, { startsAt: null }] }, orderBy: { startsAt: "asc" } }),
    db.event.findMany({ where: { published: true, startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take: 12 }),
    db.video.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 3 }),
  ]);
  if (upcoming.length + past.length === 0) notFound(); // sem eventos: seção oculta
  return (
    <AgendaList kind="evento" upcoming={upcoming} past={past}>
      {videos.length > 0 && (
        <>
          <h2 style={{ fontSize: 22, margin: "48px 0 20px", color: "var(--ink-3)" }}>Vídeos dos encontros</h2>
          <div className="video-grid">
            {videos.map((v) => {
              const id = youtubeId(v.url);
              if (!id) return null;
              return (
                <article key={v.id} className="video-card">
                  <VideoPlayer id={id} title={v.title} />
                  <h3>{v.title}</h3>
                </article>
              );
            })}
          </div>
          <Link href="/videos" className="link-arrow" style={{ marginTop: 20 }}>
            Ver todos os vídeos <Icon name="arrowUpRight" size={15} />
          </Link>
        </>
      )}
    </AgendaList>
  );
}
