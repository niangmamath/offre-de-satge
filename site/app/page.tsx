import { connection } from "next/server";
import { getDerniereMaj, getOffres } from "@/lib/db";
import OffresBoard from "@/components/OffresBoard";

function formatMaj(iso: string | null): string {
  if (!iso) return "jamais";
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  });
}

export default async function Home() {
  // Sous Next 16 (Cache Components), une requête base de données seule ne
  // force plus le rendu dynamique — sans connection(), Next.js prérendrait
  // la page une fois au build et servirait des données figées à tout le
  // monde. connection() force une exécution à CHAQUE requête.
  await connection();
  const [offres, derniereMaj] = await Promise.all([getOffres(), getDerniereMaj()]);

  return (
    <div className="min-h-full bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Stages au Maroc
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Veille automatisée — tous domaines, tous types de stage (PFE, été, initiation, alternance).
            Dernière mise à jour : {formatMaj(derniereMaj)}.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {offres === null ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Base de données non configurée (variable <code>DATABASE_URL</code> absente).
            Ce site n&apos;affiche rien tant que le pipeline de scraping n&apos;a pas été
            relié à une base Postgres.
          </div>
        ) : (
          <OffresBoard offres={offres} />
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-gray-400 sm:px-6">
        Offres collectées automatiquement (LinkedIn, Rekrute.com) — vérifiez toujours
        les conditions auprès de l&apos;entreprise avant de postuler.
      </footer>
    </div>
  );
}
