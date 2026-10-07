/**
 * Postgres local para desenvolvimento (não precisa instalar nada além do npm install).
 *   npm run db:local      → sobe na porta 5433 e fica rodando
 * Depois, em outro terminal: npm run db:push && npm run db:steps && npm run dev
 * .env: DATABASE_URL="postgresql://postgres:local@localhost:5433/aosindico"
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";

const dir = new URL("../.pgdata", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "postgres",
  password: "local",
  port: 5433,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"], // igual à produção (Neon)
});

if (!existsSync(dir)) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("aosindico");
} catch {
  /* já existe */
}
console.log("Postgres local pronto em localhost:5433 (Ctrl+C para parar)");
const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
