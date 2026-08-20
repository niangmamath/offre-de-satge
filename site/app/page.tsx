import { connection } from "next/server";
import { getDerniereMaj, getOffres, type Offre } from "@/lib/db";
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

function StatPill({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-sm">
      <span className="text-2xl font-bold text-white sm:text-3xl">{value}</span>
      <span className="text-xs font-medium uppercase tracking-wide text-indigo-100">
        {label}
      </span>
    </div>
  );
}

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

  const total = offres?.length ?? 0;
  const nouvelles = offres?.filter((o) => o.fenetre === "NOUVEAU").length ?? 0;
  const domaines = new Set(offres?.map((o) => o.domaine).filter(Boolean)).size;

  return (
    <div className="min-h-full bg-gray-50">
      {offres && offres.length > 0 ? <JobPostingJsonLd offres={offres} /> : null}

      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">
            🎓 Veille automatisée
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Trouvez votre stage au Maroc
          </h1>
          <p className="mt-4 max-w-xl text-base text-indigo-100 sm:text-lg">
            Tous domaines, tous types de stage — PFE, été, initiation, alternance.
            Collecté automatiquement depuis LinkedIn et Rekrute.com, mis à jour en continu.
          </p>

          {offres && offres.length > 0 ? (
            <div className="mt-8 flex flex-wrap gap-3">
              <StatPill value={total} label="offres actives" />
              <StatPill value={nouvelles} label="nouvelles" />
              <StatPill value={domaines} label="domaines" />
            </div>
          ) : null}

          <p className="mt-6 text-xs text-indigo-200">
            Dernière mise à jour : {formatMaj(derniereMaj)}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-gray-400 sm:px-6">
          Offres collectées automatiquement (LinkedIn, Rekrute.com) — vérifiez toujours
          les conditions auprès de l&apos;entreprise avant de postuler.
        </div>
      </footer>
    </div>
  );
}
