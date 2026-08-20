import { connection } from "next/server";
import { getDerniereMaj, getOffres, type Offre } from "@/lib/db";
import OffresExplorer from "@/components/OffresExplorer";

function JobPostingJsonLd({ offres }: { offres: Offre[] }) {
  const items = offres.slice(0, 30).map((o) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: o.poste,
    description: o.description || o.poste,
    datePosted: o.date_pub_iso || undefined,
    employmentType: "INTERN",
    hiringOrganization: {
      "@type": "Organization",
      name: o.entite || "Non précisé",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: o.ville || "Maroc",
        addressCountry: "MA",
      },
    },
    directApply: true,
    url: o.url,
  }));

  return (
    <>
      {items.map((item, i) => (
        // eslint-disable-next-line react/no-danger
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}

export default async function Home() {
  // Next 16 (Cache Components) : sans connection(), une requête base seule
  // ne suffit plus à forcer le rendu dynamique — la page serait figée au
  // moment du build. connection() force une exécution à CHAQUE requête.
  await connection();
  const [offres, derniereMaj] = await Promise.all([getOffres(), getDerniereMaj()]);

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      {offres && offres.length > 0 ? <JobPostingJsonLd offres={offres} /> : null}

      {offres === null ? (
        <>
          <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">🎓 Stages au Maroc</h1>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
              Base de données non configurée (variable <code>DATABASE_URL</code> absente).
              Ce site n&apos;affiche rien tant que le pipeline de scraping n&apos;a pas été
              relié à une base Postgres.
            </div>
          </main>
        </>
      ) : (
        <OffresExplorer offres={offres} derniereMaj={derniereMaj} />
      )}

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-gray-400 sm:px-6">
          Offres collectées automatiquement (LinkedIn, Rekrute.com) — vérifiez toujours
          les conditions auprès de l&apos;entreprise avant de postuler.
        </div>
      </footer>
    </div>
  );
}
