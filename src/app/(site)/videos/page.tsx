import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { VideoPlayer } from "@/components/site/Forms";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { youtubeId } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Vídeos para síndicos", description: "Entrevistas, palestras e dicas em vídeo sobre gestão condominial." };

export default async function VideosPage() {
  const [videos, s] = await Promise.all([
    db.video.findMany({ where: { published: true }, include: { author: true }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }] }),
    getSettings(),
  ]);
  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container page-hero__row">
          <div>
            <nav className="crumbs" aria-label="Você está em">
              <Link href="/">Início</Link> / <span>Vídeos</span>
            </nav>
            <h1>
              Vídeos <span className="serif">para síndicos.</span>
            </h1>
            <p>Palestras dos encontros, entrevistas e dicas práticas.</p>
          </div>
          {s.youtube && (
            <a href={s.youtube} target="_blank" rel="noopener" className="btn btn--glass">
              <Icon name="youtube" /> Nosso canal
            </a>
          )}
        </div>
      </section>
      <section className="section section--first">
        <div className="container">
          {videos.length === 0 ? (
            <div className="empty">
              <Icon name="youtube" size={28} />
              <strong>Novos vídeos em breve.</strong>
            </div>
          ) : (
            <div className="video-grid">
              {videos.map((v) => {
                const id = youtubeId(v.url);
                if (!id) return null;
                return (
                  <article key={v.id} id={v.slug} className="video-card" style={{ scrollMarginTop: 110 }}>
                    <VideoPlayer id={id} title={v.title} />
                    <div>
                      <div className="meta" style={{ margin: "0 0 4px" }}>
                        <span>{formatDate(v.publishedAt)}</span>
                        {v.author && (
                          <span>
                            · <Link href={`/colunistas/${v.author.slug}`}>{v.author.name}</Link>
                          </span>
                        )}
                      </div>
                      <h3>{v.title}</h3>
                      {v.description && <p style={{ fontSize: 14.5, color: "var(--ink-2)", marginTop: 6 }}>{v.description}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
