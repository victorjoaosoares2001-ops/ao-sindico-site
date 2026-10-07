/**
 * Copia as imagens ainda servidas por aosindico.com/storage para o armazenamento do projeto
 * (Vercel Blob em produção; pasta UPLOAD_DIR localmente) e troca as referências no banco.
 * Idempotente: nome fixo por URL (hash) e roda de novo no próximo deploy se algo faltar.
 */
import type { PrismaClient } from "@prisma/client";
import { put } from "@vercel/blob";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LEGACY = /https?:\/\/(?:www\.)?aosindico\.com\/storage\/[^\s"')\]<>]+/g;
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
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(25_000) });
  if (!res.ok) return null;
  const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = EXT[type] ?? (url.match(/\.(jpe?g|png|webp|gif|svg)(?:\?|$)/i)?.[1]?.toLowerCase().replace("jpeg", "jpg") || null);
  if (!ext) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0 || buf.length > 15 * 1024 * 1024) return null;
  const name = `legado/${createHash("sha1").update(url).digest("hex").slice(0, 20)}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, buf, { access: "public", contentType: type || `image/${ext}`, addRandomSuffix: false, allowOverwrite: true });
    return blob.url;
  }
  const dir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
  await mkdir(path.join(dir, "legado"), { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

export async function migrateLegacyImages(db: PrismaClient) {
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
