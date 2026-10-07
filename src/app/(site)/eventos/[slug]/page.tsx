import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgendaDetail } from "@/components/site/AgendaPages";
import { db } from "@/lib/db";

type Params = Promise<{ slug: string }>;

const load = (slug: string) => db.event.findFirst({ where: { slug, published: true } });

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const e = await load((await params).slug);
  return e ? { title: e.title, description: e.excerpt ?? undefined, openGraph: { images: e.cover ? [e.cover] : undefined } } : {};
}

export default async function EventPage({ params }: { params: Params }) {
  const e = await load((await params).slug);
  if (!e) notFound();
  return <AgendaDetail item={e} kind="evento" />;
}
