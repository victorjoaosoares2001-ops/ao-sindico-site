import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Termos de uso" };

export default async function TermsPage() {
  const s = await getSettings();
  return <LegalPage title="Termos de uso" text={s.terms_text} />;
}
