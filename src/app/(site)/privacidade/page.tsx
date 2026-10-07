import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default async function PrivacyPage() {
  const s = await getSettings();
  return <LegalPage title="Política de Privacidade" text={s.privacy_text} />;
}
