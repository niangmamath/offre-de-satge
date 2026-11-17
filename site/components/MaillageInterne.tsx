import Link from "next/link";
import {
  getVillesAvecCompte,
  getDomainesAvecCompte,
  getEntitesAvecCompte,
} from "@/lib/categories";

// Bloc SEO de maillage interne affiche sur la home : tente de capturer les
// requetes "stage <ville>", "stage <domaine>", "stage <entreprise>" en
// donnant a Google des points d'entree explicites plutot que de ne proposer
// que la fiche individuelle.
export default async function MaillageInterne() {
  const [villes, domaines, entites] = await Promise.all([
    getVillesAvecCompte(),
    getDomainesAvecCompte(),
    getEntitesAvecCompte(2),
  ]);

  const topVilles = villes.slice(0, 12);
  const topDomaines = domaines.slice(0, 10);
  const topEntites = entites.slice(0, 18);

  if (topVilles.length === 0 && topDomaines.length === 0) return null;

  return (
    <section className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Parcourir les offres
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Par ville</h3>
            <ul className="mt-3 space-y-1">
              {topVilles.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/stages/${v.slug}`}
                    className="text-sm text-gray-700 hover:text-indigo-600"
                  >
                    Stages à {v.ville}
                    <span className="ml-1 text-xs text-gray-400">({v.n})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Par domaine</h3>
            <ul className="mt-3 space-y-1">
              {topDomaines.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/domaine/${d.slug}`}
                    className="text-sm text-gray-700 hover:text-indigo-600"
                  >
                    Stages {d.domaine}
                    <span className="ml-1 text-xs text-gray-400">({d.n})</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/stages/pfe-2027"
                className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Campagne PFE 2026-2027 →
              </Link>
              <Link
                href="/nouveautes"
                className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Nouveautés 7 jours →
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Par entreprise</h3>
            <ul className="mt-3 space-y-1">
              {topEntites.map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/entreprises/${e.slug}`}
                    className="text-sm text-gray-700 hover:text-indigo-600"
                  >
                    {e.entite}
                    <span className="ml-1 text-xs text-gray-400">({e.n})</span>
                  </Link>
                </li>
              ))}
            </ul>
            {entites.length > topEntites.length ? (
              <div className="mt-3">
                <Link
                  href="/entreprises"
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Voir toutes les entreprises →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
