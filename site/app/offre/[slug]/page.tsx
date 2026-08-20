import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import type { Metadata } from "next";
import { getOffreBySlug } from "@/lib/db";

const FENETRE_STYLE: Record<string, string> = {
  NOUVEAU: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  OUVERTE: "bg-teal-50 text-teal-700 ring-teal-600/20",
  ROUVERTE: "bg-sky-50 text-sky-700 ring-sky-600/20",
  VIVIER: "bg-amber-50 text-amber-800 ring-amber-600/20",
  "AGÉE": "bg-gray-100 text-gray-600 ring-gray-500/20",
  INCONNUE: "bg-gray-50 text-gray-500 ring-gray-400/20",
};

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "Date de publication non précisée";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `Publiée le ${d}/${m}/${y}`;
}

export async function generateMetadata(props: PageProps<"/offre/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const offre = await getOffreBySlug(slug);
  if (!offre) return { title: "Offre introuvable" };

  const title = `${offre.poste} — ${offre.entite || "Stage"}`;
  const description =
    offre.description ||
    `Offre de stage : ${offre.poste} chez ${offre.entite || "une entreprise"} à ${offre.ville || "Maroc"}.`;

  return {
    title,
    description,
    alternates: { canonical: `/offre/${offre.slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

function JobPostingJsonLd({ offre }: { offre: NonNullable<Awaited<ReturnType<typeof getOffreBySlug>>> }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offre.poste,
    description: offre.description || offre.poste,
    datePosted: offre.date_pub_iso || undefined,
    employmentType: "INTERN",
    hiringOrganization: { "@type": "Organization", name: offre.entite || "Non précisé" },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: offre.ville || "Maroc",
        addressCountry: "MA",
      },
    },
    directApply: true,
    url: offre.url,
  };
  return (
    // eslint-disable-next-line react/no-danger
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  );
}

export default async function OffreDetailPage(props: PageProps<"/offre/[slug]">) {
  // Next 16 (Cache Components) : force le rendu à chaque requête, comme la
  // page d'accueil — une offre peut être retirée de la base entre deux
  // visites (cf. db_sync.py), la page ne doit jamais être figée au build.
  await connection();
  const { slug } = await props.params;
  const offre = await getOffreBySlug(slug);
  if (!offre) notFound();

  const style = FENETRE_STYLE[offre.fenetre] ?? FENETRE_STYLE.INCONNUE;

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      <JobPostingJsonLd offre={offre} />

      <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/" className="text-sm text-indigo-100 hover:text-white">
            ← Retour à toutes les offres
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{offre.poste}</h1>
            <Badge className={style}>{offre.fenetre}</Badge>
          </div>

          <p className="mt-2 text-base text-gray-600">
            <span className="font-semibold text-gray-800">{offre.entite || "Entreprise non précisée"}</span>
            {offre.ville ? <span> · {offre.ville}</span> : null}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-600/20">
              {offre.domaine || "Autre"}
            </Badge>
            {offre.type_stage && offre.type_stage !== "Non précisé" ? (
              <Badge className="bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20">
                {offre.type_stage}
              </Badge>
            ) : null}
            {offre.duree ? (
              <Badge className="bg-gray-50 text-gray-600 ring-gray-400/20">{offre.duree}</Badge>
            ) : null}
          </div>

          {offre.description ? (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {offre.description}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-100 pt-4 text-xs text-gray-400">
            <span>{formatDate(offre.date_pub_iso)}</span>
            <span>Source : {offre.source}</span>
            {offre.candidats != null ? <span>{offre.candidats} candidat(s) déjà postulé(s)</span> : null}
          </div>

          <a
            href={offre.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            Voir l&apos;offre originale et postuler
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <p className="mt-2 text-center text-xs text-gray-400">
            Vous quittez Stages au Maroc — la candidature se fait sur le site de l&apos;annonceur ({offre.source}).
          </p>
        </div>
      </main>
    </div>
  );
}
