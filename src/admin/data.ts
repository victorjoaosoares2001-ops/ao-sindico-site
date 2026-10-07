import "server-only";
import { db } from "@/lib/db";
import type { ModelName } from "./resources";

type Args = Record<string, unknown>;
type Row = Record<string, unknown> & { id: string };

/** Acesso genérico aos models do Prisma usado pelos cadastros do painel. */
export type Delegate = {
  findMany(args?: Args): Promise<Row[]>;
  findUnique(args: Args): Promise<Row | null>;
  findFirst(args: Args): Promise<Row | null>;
  create(args: Args): Promise<Row>;
  update(args: Args): Promise<Row>;
  delete(args: Args): Promise<Row>;
  count(args?: Args): Promise<number>;
};

export function delegate(model: ModelName): Delegate {
  return (db as unknown as Record<ModelName, Delegate>)[model];
}

/** Valor para <input type="date|datetime-local"> no horário de Brasília. */
export function toInputDate(value: unknown, withTime: boolean) {
  if (!value) return "";
  const d = new Date(value as string);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d); // "2026-12-05 19:00"
  const [date, time] = parts.split(" ");
  return withTime ? `${date}T${time}` : date;
}

/** Converte o valor do input (horário de Brasília) para Date. */
export function fromInputDate(value: string, withTime: boolean) {
  if (!value) return null;
  const iso = withTime ? `${value}:00-03:00` : `${value}T12:00:00-03:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}
