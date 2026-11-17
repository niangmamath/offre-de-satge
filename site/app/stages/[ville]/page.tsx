import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import CategorieLanding from "@/components/CategorieLanding";
import {
  getVillesAvecCompte,
  getOffresParVille,
} from "@/lib/categories";

export const revalidate = 3600;

type Params = Promise<{ ville: string }>;

// On re-genere la liste quand la base change. Les 20 villes les plus fournies
// sont pre-rendues au build ; les autres sont rendues a la volee puis cachees.
export async function generateStaticParams() {
  const villes = await getVillesAvecCompte();
  return villes.slice(0, 20).map((v) => ({ ville: v.slug }));
}

async function resoudreVille(slug: string): Promise<{ ville: string; n: number } | null> {
  const toutes = await getVillesAvecCompte();
  return toutes.find((v) => v.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { ville: slug } = await params;
  const trouve = await resoudreVille(slug);
  if (!trouve) return { title: "Ville introuvable" };

  const nom = trouve.ville;
  const path = `/stages/${slug}`;
  return {
    title: `Stages à ${nom} — toutes les offres actives`,
    description: `${trouve.n} offres de stage à ${nom} au Maroc : PFE, pré-embauche, été. Mises à jour en continu depuis LinkedIn et Rekrute.`,
    keywords: [
      `stage ${nom}`,
      `stage PFE ${nom}`,
      `offre de stage ${nom}`,
      `stagiaire ${nom}`,
      `emploi stage ${nom}`,
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `Stages à ${nom} au Maroc`,
      description: `Toutes les offres de stage actives à ${nom}.`,
      url: path,
    },
  };
}

export default async function VillePage({ params }: { params: Params }) {
  await connection();
  const { ville: slug } = await params;
  const trouve = await resoudreVille(slug);
  if (!trouve) notFound();

  const offres = await getOffresParVille(trouve.ville);
  const path = `/stages/${slug}`;

  return (
    <CategorieLanding
      h1={`Stages à ${trouve.ville} au Maroc`}
      titre={`Stages à ${trouve.ville}`}
      canonicalPath={path}
      breadcrumb={[
        { nom: "Accueil", url: "/" },
        { nom: `Stages ${trouve.ville}`, url: path },
      ]}
      intro={
        <p>
          Toutes les offres de stage actives à <strong>{trouve.ville}</strong> :
          PFE, pré-embauche, stages d&apos;été et initiation, tous domaines
          confondus. Nouvelles offres ajoutées chaque jour.
        </p>
      }
      offres={offres}
    />
  );
}
