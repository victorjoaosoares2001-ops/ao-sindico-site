import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

export const MAX_UPLOAD = 6 * 1024 * 1024;

export function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || "./uploads");
}

/**
 * Salva a imagem e devolve a URL pública.
 * Na Vercel (BLOB_READ_WRITE_TOKEN definido) vai para o Vercel Blob;
 * em servidor próprio, para a pasta UPLOAD_DIR servida em /uploads.
 */
export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Formato de imagem não aceito. Use JPG, PNG, WEBP ou SVG.");
  if (file.size > MAX_UPLOAD) throw new Error("Imagem muito grande (máximo 6 MB).");
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${name}`, file, { access: "public", contentType: file.type });
    return blob.url;
  }

  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
