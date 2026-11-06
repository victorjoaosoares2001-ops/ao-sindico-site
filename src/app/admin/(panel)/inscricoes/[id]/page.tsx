import Link from "next/link";
import { notFound } from "next/navigation";
import { saveRegistration } from "@/admin/actions";
import { SimpleForm } from "@/components/admin/SimpleForm";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Inscrição" };

const TYPES = ["Síndico", "Staff", "Patrocinador", "Visitante", "Gerente Predial", "Zelador", "Administrador"];

export default async function RegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("agenda");
  const { id } = await params;
  const isNew = id === "novo";
  const [reg, events] = await Promise.all([
    isNew ? null : db.eventRegistration.findUnique({ where: { id } }),
    db.event.findMany({ orderBy: { startsAt: "desc" }, select: { id: true, title: true } }),
  ]);
  if (!isNew && !reg) notFound();
  return (
    <>
      <Link href="/admin/inscricoes" className="adm-back">
        <Icon name="arrowLeft" size={15} /> Inscrições
      </Link>
      <div className="adm-head">
        <div>
          <h1>{isNew ? "Nova inscrição" : "Editar inscrição"}</h1>
          <p>Campos com * são obrigatórios.</p>
        </div>
      </div>
      <section className="panel panel__pad" style={{ maxWidth: 640 }}>
        <SimpleForm action={saveRegistration.bind(null, reg?.id ?? null)} submit="Salvar">
          <label className="field">
            <span>Evento *</span>
            <select name="eventId" className="select" defaultValue={reg?.eventId ?? events[0]?.id} required>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Nome *</span>
            <input name="name" className="input" defaultValue={reg?.name} required maxLength={120} />
          </label>
          <label className="field">
            <span>E-mail *</span>
            <input name="email" type="email" className="input" defaultValue={reg?.email} required maxLength={160} />
          </label>
          <label className="field">
            <span>Telefone</span>
            <input name="phone" className="input" defaultValue={reg?.phone ?? ""} maxLength={40} />
          </label>
          <label className="field">
            <span>Condomínio</span>
            <input name="condo" className="input" defaultValue={reg?.condo ?? ""} maxLength={160} />
          </label>
          <label className="field">
            <span>Tipo</span>
            <input name="role" className="input" list="tipos" defaultValue={reg?.role ?? ""} maxLength={60} />
            <datalist id="tipos">
              {TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
        </SimpleForm>
      </section>
    </>
  );
}
