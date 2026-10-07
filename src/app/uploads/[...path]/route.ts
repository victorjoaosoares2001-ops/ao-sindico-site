import { readFile } from "node:fs/promises";
import path from "node:path";
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
  try {
    const data = await readFile(file);
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(ext === "svg" ? { "Content-Security-Policy": "script-src 'none'" } : {}),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
