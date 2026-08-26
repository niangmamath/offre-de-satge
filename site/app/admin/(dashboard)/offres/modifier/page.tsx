import { notFound } from "next/navigation";
import { getOffreByUrlAdmin } from "@/lib/db";
import AdminOffreForm from "@/components/AdminOffreForm";

export default async function ModifierOffrePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  if (!url) notFound();

  const offre = await getOffreByUrlAdmin(url);
  if (!offre) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">Modifier l&apos;offre</h1>
      {!offre.manuel ? (
        <p className="text-xs text-amber-700">
          Cette offre provient du scraping automatique : vos modifications peuvent être
          écrasées au prochain passage si l&apos;offre est toujours active sur sa source.
        </p>
      ) : null}
      <AdminOffreForm
        url={offre.url}
        initial={{
          poste: offre.poste,
          entite: offre.entite || "",
          ville: offre.ville || "",
          description: offre.description || "",
          domaine: offre.domaine || "Autre",
          type_stage: offre.type_stage || "Non précisé",
          duree: offre.duree || "",
          indemnite: offre.indemnite || "",
        }}
      />
    </div>
  );
}
