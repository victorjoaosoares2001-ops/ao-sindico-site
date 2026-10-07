import { saveSettings } from "@/admin/actions";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings, SETTING_GROUPS } from "@/lib/settings";

export const metadata = { title: "Textos do site" };

export default async function ContentPage() {
  await requireAdmin("site");
  const values = await getSettings();
  const groups = SETTING_GROUPS.map((g) => ({
    title: g.title,
    hint: g.hint,
    fields: g.fields.map((f) => ({ key: f.key, label: f.label, type: "type" in f ? f.type : "text" })),
  }));
  return (
    <>
      <div className="adm-head">
        <div>
          <h1>Textos do site</h1>
          <p>Títulos, números, contatos e redes sociais que aparecem no site.</p>
        </div>
      </div>
      <SettingsForm action={saveSettings} groups={groups} values={values} />
    </>
  );
}
