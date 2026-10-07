import { History } from "@/components/admin/History";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Histórico" };

export default async function HistoryPage() {
  await requireAdmin("historico");
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Histórico</h1>
          <p>Quem fez o quê no painel: cadastros, publicações, orçamentos e acessos.</p>
        </div>
      </div>
      <section className="panel panel__pad">
        <History take={200} />
      </section>
    </>
  );
}
