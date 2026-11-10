/**
 * Copia as imagens ainda servidas por aosindico.com/storage para public/legado (vão junto com o site)
 * e troca as referências no banco. Idempotente: nome fixo por URL (hash).
 * Antes ficavam no Vercel Blob, que foi bloqueado em 11/2026 e derrubou todas as fotos: nada de Blob aqui.
 */
import type { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PUBLIC_DIR = path.resolve("public/legado");
// endereços antigos das mesmas cópias: Vercel Blob (bloqueado) e a pasta local de desenvolvimento
const OLD_COPIES = /https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/legado\/|\/uploads\/legado\//g;

const LEGACY = /https?:\/\/(?:www\.|antigo\.)?aosindico\.com\/storage\/[^\s"')\]<>]+/g;
const HEADERS = { "user-agent": "Mozilla/5.0 (migracao Ao Sindico)" };
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" };
const TIME_BUDGET_MS = 6 * 60_000;
const CONCURRENCY = 5;

type Col = { model: string; field: string; text?: boolean };
const COLUMNS: Col[] = [
  { model: "supplier", field: "logo" },
  { model: "supplier", field: "cover" },
  { model: "article", field: "cover" },
  { model: "article", field: "content", text: true },
  { model: "author", field: "photo" },
  { model: "campaign", field: "image" },
  { model: "partner", field: "logo" },
  { model: "event", field: "cover" },
  { model: "course", field: "cover" },
  { model: "question", field: "answer", text: true },
];

type Delegate = {
  findMany(a: unknown): Promise<Record<string, string | null>[]>;
  update(a: unknown): Promise<unknown>;
};

async function store(url: string): Promise<string | null> {
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 20);
  const local = existsSync(PUBLIC_DIR) ? readdirSync(PUBLIC_DIR).find((f) => f.startsWith(hash + ".")) : undefined;
  if (local) return `/legado/${local}`;
  // aosindico.com agora aponta para o site novo: os arquivos antigos ficaram em antigo.aosindico.com
  const from = url.replace(/\/\/(?:www\.)?aosindico\.com\//, "//antigo.aosindico.com/");
  const res = await fetch(from, { headers: HEADERS, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = EXT[type] ?? (url.match(/\.(jpe?g|png|webp|gif|svg)(?:\?|$)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || null);
  if (!ext) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0 || buf.length > 15 * 1024 * 1024) return null;
  const name = `${createHash("sha1").update(url).digest("hex").slice(0, 20)}.${ext}`;
  // roda antes do `next build`: o que for gravado em public/ entra na publicação
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_DIR, name), buf);
  return `/legado/${name}`;
}

/** Troca os endereços das cópias já feitas (Blob / pasta local) por /legado/ e avisa se faltar algum arquivo. */
async function relocateCopies(db: PrismaClient) {
  const d = (m: string) => (db as unknown as Record<string, Delegate>)[m];
  const have = new Set(existsSync(PUBLIC_DIR) ? readdirSync(PUBLIC_DIR) : []);
  const missing = new Set<string>();
  let updated = 0;
  const swap = (v: string) => {
    const next = v.replace(OLD_COPIES, "/legado/");
    for (const m of next.matchAll(/\/legado\/([a-f0-9]{20}\.\w+)/g)) if (!have.has(m[1])) missing.add(m[1]);
    return next;
  };
  for (const col of COLUMNS) {
    for (const where of [{ contains: ".blob.vercel-storage.com/legado/" }, { contains: "/uploads/legado/" }]) {
      const rows = await d(col.model).findMany({ where: { [col.field]: where }, select: { id: true, [col.field]: true } });
      for (const r of rows) {
        const v = r[col.field];
        if (!v) continue;
        await d(col.model).update({ where: { id: r.id }, data: { [col.field]: swap(v) } });
        updated++;
      }
    }
  }
  for (const s of await db.siteSetting.findMany({ where: { value: { contains: "/legado/" } } })) {
    const next = swap(s.value);
    if (next !== s.value) {
      await db.siteSetting.update({ where: { key: s.key }, data: { value: next } });
      updated++;
    }
  }
  // imagens enviadas pelo painel continuam no Blob: só listo quantas ficaram presas lá
  let stuck = 0;
  for (const col of COLUMNS) stuck += (await d(col.model).findMany({ where: { [col.field]: { contains: ".blob.vercel-storage.com/" } }, select: { id: true } })).length;
  console.log(`✔ imagens-no-site — ${updated} referências trocadas para /legado/` + (stuck ? `; ${stuck} ainda no Vercel Blob (enviadas pelo painel)` : ""));
  if (missing.size) console.log(`  FALTAM em public/legado: ${[...missing].join(" ")}`);
}

export async function migrateLegacyImages(db: PrismaClient) {
  await relocateCopies(db);
  const started = Date.now();
  const d = (m: string) => (db as unknown as Record<string, Delegate>)[m];

  // 1) coleta todas as URLs antigas
  const rows: { col: Col; id: string; value: string }[] = [];
  for (const col of COLUMNS) {
    const found = await d(col.model).findMany({ where: { [col.field]: { contains: "aosindico.com/storage" } }, select: { id: true, [col.field]: true } });
    for (const r of found) if (r[col.field]) rows.push({ col, id: r.id as string, value: r[col.field] as string });
  }
  const settings = await db.siteSetting.findMany({ where: { value: { contains: "aosindico.com/storage" } } });
  const urls = new Set<string>();
  for (const r of rows) for (const m of r.value.matchAll(LEGACY)) urls.add(m[0]);
  for (const s of settings) for (const m of s.value.matchAll(LEGACY)) urls.add(m[0]);
  if (urls.size === 0) return;

  // 2) baixa e guarda (com limite de tempo por build)
  const map = new Map<string, string>();
  const failed: string[] = [];
  const queue = [...urls];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && Date.now() - started < TIME_BUDGET_MS) {
        const url = queue.shift()!;
        try {
          const stored = await store(url);
          if (stored) map.set(url, stored);
          else failed.push(url);
        } catch {
          failed.push(url);
        }
      }
    }),
  );

  // 3) troca as referências
  const swap = (v: string) => v.replace(LEGACY, (u) => map.get(u) ?? u);
  let updated = 0;
  for (const r of rows) {
    const next = swap(r.value);
    if (next !== r.value) {
      await d(r.col.model).update({ where: { id: r.id }, data: { [r.col.field]: next } });
      updated++;
    }
  }
  for (const s of settings) {
    const next = swap(s.value);
    if (next !== s.value) await db.siteSetting.update({ where: { key: s.key }, data: { value: next } });
  }
  console.log(
    `✔ imagens-legadas — ${map.size} de ${urls.size} copiadas, ${updated} referências trocadas` +
      (failed.length ? `, ${failed.length} indisponíveis no site antigo` : "") +
      (queue.length ? `, ${queue.length} ficam para o próximo deploy` : ""),
  );
  if (failed.length) console.log(`  indisponíveis (exemplos): ${failed.slice(0, 5).join(" ")}`);
}
