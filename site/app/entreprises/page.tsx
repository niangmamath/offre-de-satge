import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { getEntitesAvecCompte } from "@/lib/categories";
import { CapIcon } from "@/components/icons";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Entreprises qui recrutent en stage au Maroc",
  description:
    "Liste des entreprises qui recrutent en stage au Maroc : KPMG, Deloitte, Capgemini, Stellantis, L'Oréal, Societe Generale et bien d'autres. Toutes les offres actives.",
  alternates: { canonical: "/entreprises" },
};

export default async function EntreprisesIndex() {
  await connection();
  const entites = await getEntitesAvecCompte(2);

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_10%,white,transparent_30%),radial-gradient(circle_at_85%_0%,white,transparent_25%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="flex items-start gap-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            <CapIcon className="mt-1 h-6 w-6 shrink-0 sm:h-7 sm:w-7" />
            Entreprises qui recrutent en stage au Maroc
          </h1>
          <p className="mt-2 text-sm text-indigo-100">
            {entites.length} entreprise{entites.length > 1 ? "s" : ""} avec au moins 2 offres actives.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {entites.map((e) => (
            <Link
              key={e.slug}
              href={`/entreprises/${e.slug}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <span className="truncate font-medium text-gray-900">{e.entite}</span>
              <span className="ml-2 shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {e.n} offres
              </span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-gray-400 sm:px-6 space-y-2">
          <p>
            <Link href="/" className="hover:text-gray-600">
              Accueil
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
    </div>
  );
}
