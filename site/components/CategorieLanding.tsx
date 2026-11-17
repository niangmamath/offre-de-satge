import Link from "next/link";
import type { Offre } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";
import OffreCard from "./OffreCard";
import { CapIcon } from "@/components/icons";

type Props = {
  h1: string;
  titre: string; // Pour JSON-LD et titre du bloc
  intro: React.ReactNode;
  offres: Offre[];
  canonicalPath: string; // ex: "/stages/casablanca"
  breadcrumb: { nom: string; url: string }[];
};

// Page de landing SEO pour une categorie (ville, domaine, entreprise, campagne).
// Volontairement proche du home mais sans les filtres interactifs : la page est
// deja filtree, et chaque categorie a son propre H1/intro pour cibler une
// requete Google precise.
export default function CategorieLanding({
  h1,
  titre,
  intro,
  offres,
  canonicalPath,
  breadcrumb,
}: Props) {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: titre,
    itemListElement: offres.slice(0, 50).map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/offre/${o.slug}`,
      name: o.poste,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.nom,
      item: `${siteUrl}${b.url}`,
    })),
  };

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      {offres.length > 0 ? (
        /* eslint-disable-next-line react/no-danger */
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      ) : null}
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_10%,white,transparent_30%),radial-gradient(circle_at_85%_0%,white,transparent_25%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <nav aria-label="Fil d'Ariane" className="text-xs text-indigo-100">
            {breadcrumb.map((b, i) => (
              <span key={b.url}>
                {i > 0 ? " / " : null}
                {i === breadcrumb.length - 1 ? (
                  <span className="text-white">{b.nom}</span>
                ) : (
                  <Link href={b.url} className="hover:text-white">
                    {b.nom}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          <h1 className="mt-3 flex items-start gap-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            <CapIcon className="mt-1 h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            {h1}
          </h1>
          <div className="mt-3 max-w-3xl text-sm text-indigo-100 sm:text-base">{intro}</div>
          <p className="mt-3 text-xs font-medium text-indigo-100">
            {offres.length > 0
              ? `${offres.length} offre${offres.length > 1 ? "s" : ""} actuellement`
              : "Aucune offre pour le moment — repassez dans quelques jours."}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {offres.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offres.map((o) => (
              <OffreCard key={o.slug} offre={o} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Nous collectons en continu — de nouvelles offres apparaitront ici
            dans les prochains jours.{" "}
            <Link href="/" className="font-medium text-indigo-600 hover:underline">
              Voir toutes les offres
            </Link>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-gray-400 sm:px-6 space-y-2">
          <p>
            Offres collectées automatiquement — vérifiez toujours les
            conditions auprès de l&apos;entreprise avant de postuler.
          </p>
          <p>
            <Link href="/" className="hover:text-gray-600">
              Accueil
            </Link>
            {" · "}
            <Link href="/contact" className="hover:text-gray-600">
              Contact
            </Link>
            {" · "}
            <Link href="/mentions-legales" className="hover:text-gray-600">
              Mentions légales
            </Link>
            {" · "}
            <Link href="/politique-confidentialite" className="hover:text-gray-600">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </footer>

      {/* URL canonique rappelee a Google pour ce landing */}
      <link rel="canonical" href={`${siteUrl}${canonicalPath}`} />
    </div>
  );
}
