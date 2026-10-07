import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgendaDetail } from "@/components/site/AgendaPages";
import { db } from "@/lib/db";

type Params = Promise<{ slug: string }>;

const load = (slug: string) => db.course.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const c = await load((await params).slug);
  return c ? { title: c.title, description: c.excerpt ?? undefined, openGraph: { images: c.cover ? [c.cover] : undefined } } : {};
}

export default async function CoursePage({ params }: { params: Params }) {
  const c = await load((await params).slug);
  if (!c) notFound();
  return <AgendaDetail item={c} kind="curso" />;
}
