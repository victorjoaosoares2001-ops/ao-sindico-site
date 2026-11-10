import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { uploadDir } from "@/lib/upload";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const base = uploadDir();
  const file = path.resolve(base, ...parts);
  if (!file.startsWith(base + path.sep)) return new Response("Not found", { status: 404 });
  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const headers = {
    "Content-Type": TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    ...(ext === "svg" ? { "Content-Security-Policy": "script-src 'none'" } : {}),
  };
  try {
    return new Response(new Uint8Array(await readFile(file)), { headers });
  } catch {
    // na Vercel o arquivo está no banco (ver lib/upload.ts)
    const row = parts.length === 1 ? await db.uploadFile.findUnique({ where: { name: parts[0] } }) : null;
    return row ? new Response(new Uint8Array(row.data), { headers: { ...headers, "Content-Type": row.type } }) : new Response("Not found", { status: 404 });
  }
}
