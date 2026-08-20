import { connection } from "next/server";
import { getDerniereMaj, getOffres, type Offre } from "@/lib/db";
import OffresExplorer from "@/components/OffresExplorer";
import NewsletterForm from "@/components/NewsletterForm";

// Liste simple, pas de JobPosting ici : Google recommande UN JobPosting sur
// la page dédiée à CETTE offre (cf. app/offre/[slug]/page.tsx), pas groupés
// sur une page de listing — sinon Google Jobs les ignore ou les pénalise.
function ItemListJsonLd({ offres }: { offres: Offre[] }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: offres.slice(0, 50).map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `/offre/${o.slug}`,
      name: o.poste,
    })),
  };
  return (
    // eslint-disable-next-line react/no-danger
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
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
      {offres && offres.length > 0 ? <ItemListJsonLd offres={offres} /> : null}

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
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
          <p className="text-sm font-semibold text-gray-800">
            📬 Recevez les nouvelles offres par email, tous les 2 jours
          </p>
          <NewsletterForm />
        </div>
        <div className="border-t border-gray-100 px-4 py-6 text-center text-xs text-gray-400 sm:px-6">
          Offres collectées automatiquement (LinkedIn, Rekrute.com) — vérifiez toujours
          les conditions auprès de l&apos;entreprise avant de postuler.
        </div>
      </footer>
    </div>
  );
}
