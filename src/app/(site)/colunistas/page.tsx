import type { Metadata } from "next";
import Link from "next/link";
import { initials } from "@/components/site/Cards";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Colunistas", description: "Especialistas que escrevem no portal Ao Síndico." };

export default async function AuthorsPage() {
  const authors = await db.author.findMany({
    where: { published: true },
    include: { _count: { select: { articles: { where: { published: true } }, answers: { where: { published: true } } } } },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });
  const visible = authors.filter((a) => a._count.articles + a._count.answers > 0 || a.bio);
  return (
    <>
      <section className="page-hero page-hero--slim">
        <div className="container">
          <nav className="crumbs" aria-label="Você está em">
            <Link href="/">Início</Link> / <span>Colunistas</span>
          </nav>
          <h1>
            Colunistas <span className="serif">e especialistas.</span>
          </h1>
          <p>Advogados, síndicos, administradores e empresas que compartilham conhecimento no portal.</p>
        </div>
      </section>
      <section className="section section--first">
        <div className="container">
          <div className="author-grid">
            {visible.map((a) => (
              <Link key={a.id} href={`/colunistas/${a.slug}`} className="author-tile">
                <span className="avatar">{a.photo ? <img src={a.photo} alt="" loading="lazy" /> : initials(a.name)}</span>
                <span>
                  <strong>{a.name}</strong>
                  <span>
                    {a.role ? `${a.role} · ` : ""}
                    {a._count.articles} {a._count.articles === 1 ? "matéria" : "matérias"}
                    {a._count.answers ? ` · ${a._count.answers} respostas` : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
