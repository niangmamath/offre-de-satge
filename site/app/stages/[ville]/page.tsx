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

// Pas de generateStaticParams : trop de pages en parallele au build
// saturaient Neon. ISR a la volee suffit, avec revalidate=3600.

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
      contexteFAQ={{ type: "ville", nom: trouve.ville }}
    />
  );
}
