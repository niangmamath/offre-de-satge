import Link from "next/link";
import { connection } from "next/server";
import { getDerniereMaj, getOffresCartes, type Offre } from "@/lib/db";
import OffresExplorerShell from "@/components/OffresExplorerShell";
import OffreCard from "@/components/OffreCard";
import NewsletterForm from "@/components/NewsletterForm";
import MaillageInterne from "@/components/MaillageInterne";
import { CapIcon, MailboxIcon } from "@/components/icons";

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

const PAR_PAGE = 30;
const PUB_MAX: Record<string, number> = {
  "Aujourd'hui ou hier": 1,
  "7 derniers jours": 7,
  "30 derniers jours": 30,
};

type SP = Record<string, string | string[] | undefined>;

function premiere(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function uniqueSorted(values: (string | null)[]): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => !!v))
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

export default async function Home({ searchParams }: { searchParams: Promise<SP> }) {
  // Next 16 (Cache Components) : sans connection(), une requête base seule
  // ne suffit plus à forcer le rendu dynamique — la page serait figée au
  // moment du build. connection() force une exécution à CHAQUE requête.
  await connection();
  const [offres, derniereMaj, sp] = await Promise.all([
    getOffresCartes(),
    getDerniereMaj(),
    searchParams,
  ]);
  const villesNewsletter = Array.from(
    new Set((offres ?? []).map((o) => o.ville).filter((v): v is string => !!v))
  ).sort((a, b) => a.localeCompare(b, "fr"));

  if (offres === null) {
    return (
      <div className="flex min-h-full flex-col bg-gray-50">
        <header className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-4 py-8 sm:px-6">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
            <CapIcon className="h-6 w-6 shrink-0" />
            Stages au Maroc
          </h1>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            Base de données non configurée (variable <code>DATABASE_URL</code> absente).
          </div>
        </main>
      </div>
    );
  }

  // Lecture des filtres depuis l'URL
  const q = premiere(sp.q).trim().toLowerCase();
  const domaine = premiere(sp.domaine);
  const typeStage = premiere(sp.type_stage);
  const ville = premiere(sp.ville);
  const publication = premiere(sp.publication);
  const ageMax = PUB_MAX[publication] ?? null;
  const show = Math.min(
    600,
    Math.max(PAR_PAGE, parseInt(premiere(sp.show) || String(PAR_PAGE), 10) || PAR_PAGE)
  );

  // Facettes : toutes les villes/domaines/types de la base (pas uniquement
  // ceux qui passent le filtre courant — sinon les selects se vident au fur
  // et a mesure qu'on filtre, c'est perturbant).
  const villes = uniqueSorted(offres.map((o) => o.ville));
  const domaines = uniqueSorted(offres.map((o) => o.domaine));
  const typesStage = uniqueSorted(offres.map((o) => o.type_stage));
  const nouvelles = offres.filter((o) => o.fenetre === "NOUVEAU").length;

  const filtrees = offres.filter((o) => {
    if (q) {
      const blob = `${o.poste} ${o.entite ?? ""}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (domaine && o.domaine !== domaine) return false;
    if (typeStage && o.type_stage !== typeStage) return false;
    if (ville && o.ville !== ville) return false;
    if (ageMax !== null && (o.age_jours === null || o.age_jours > ageMax)) return false;
    return true;
  });
  const affichees = filtrees.slice(0, show);
  const filtresActifs = !!(q || domaine || typeStage || ville || publication);

  return (
    <div className="flex min-h-full flex-col bg-gray-50">
      {offres.length > 0 && !filtresActifs ? <ItemListJsonLd offres={affichees} /> : null}

      <OffresExplorerShell
        total={offres.length}
        affiche={filtrees.length}
        nouvelles={nouvelles}
        derniereMaj={derniereMaj}
        villes={villes}
        domaines={domaines}
        typesStage={typesStage}
        showCount={show}
        canShowMore={show < filtrees.length}
      >
        {affichees.map((o) => (
          <div key={o.slug} data-slug={o.slug} data-fenetre={o.fenetre}>
            <OffreCard offre={o} />
          </div>
        ))}
      </OffresExplorerShell>

      <MaillageInterne />

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div
          id="newsletter"
          className="mx-auto flex max-w-6xl scroll-mt-6 flex-col items-center gap-3 px-4 py-10 text-center sm:px-6"
        >
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
            <MailboxIcon className="h-4 w-4 shrink-0 text-indigo-600" />
            Recevez les nouvelles offres par email, chaque semaine
          </p>
          <NewsletterForm villes={villesNewsletter} />
        </div>
        <div className="border-t border-gray-100 px-4 py-6 text-center text-xs text-gray-400 sm:px-6 space-y-2">
          <p>
            Offres collectées automatiquement (LinkedIn, Rekrute.com, Stagiaires.ma) —
            vérifiez toujours les conditions auprès de l&apos;entreprise avant de postuler.
          </p>
          <p>
            Une idée pour améliorer le site, un problème ?{" "}
            <Link href="/contact" className="font-medium text-indigo-600 hover:underline">
              Contactez-nous
            </Link>
          </p>
          <p>
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
