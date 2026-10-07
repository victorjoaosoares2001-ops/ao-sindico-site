import { cache } from "react";
import { db } from "./db";

/**
 * Quais seções têm conteúdo publicado. Seções vazias somem do menu, do rodapé e do
 * sitemap, e a página delas responde 404 — reaparecem sozinhas quando a equipe publicar algo.
 */
export const sectionAvailability = cache(async () => {
  const [videos, courses, partners, events, authors, questions] = await Promise.all([
    db.video.count({ where: { published: true } }),
    db.course.count({ where: { published: true } }),
    db.partner.count({ where: { published: true } }),
    db.event.count({ where: { published: true } }),
    db.author.count({ where: { published: true, OR: [{ articles: { some: { published: true } } }, { answers: { some: { published: true } } }] } }),
    db.question.count({ where: { published: true } }),
  ]);
  return {
    "/videos": videos > 0,
    "/cursos": courses > 0,
    "/parceiros": partners > 0,
    "/eventos": events > 0,
    "/colunistas": authors > 0,
    "/tira-duvidas": true, // sempre aberta: tem o formulário de perguntas
  } as Record<string, boolean>;
});

/** true se o link deve aparecer (rotas fora da lista sempre aparecem). */
export function isAvailable(map: Record<string, boolean>, href: string) {
  const key = Object.keys(map).find((k) => href === k || href.startsWith(k + "?"));
  return key ? map[key] : true;
}
