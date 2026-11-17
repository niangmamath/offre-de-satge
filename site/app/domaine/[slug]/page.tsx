import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import CategorieLanding from "@/components/CategorieLanding";
import {
  getDomainesAvecCompte,
  getOffresParDomaine,
} from "@/lib/categories";

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const domaines = await getDomainesAvecCompte();
  return domaines.map((d) => ({ slug: d.slug }));
}

async function resoudreDomaine(slug: string) {
  const toutes = await getDomainesAvecCompte();
  return toutes.find((d) => d.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const trouve = await resoudreDomaine(slug);
  if (!trouve) return { title: "Domaine introuvable" };

  const nom = trouve.domaine;
  const path = `/domaine/${slug}`;
  return {
    title: `Stages ${nom} au Maroc — toutes les offres`,
    description: `${trouve.n} offres de stage en ${nom} au Maroc : PFE, pré-embauche, été. Mises à jour en continu.`,
    keywords: [
      `stage ${nom}`,
      `stage PFE ${nom}`,
      `offre de stage ${nom}`,
      `stagiaire ${nom}`,
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `Stages ${nom} au Maroc`,
      description: `Toutes les offres de stage en ${nom} au Maroc.`,
      url: path,
    },
  };
}

export default async function DomainePage({ params }: { params: Params }) {
  await connection();
  const { slug } = await params;
  const trouve = await resoudreDomaine(slug);
  if (!trouve) notFound();

  const offres = await getOffresParDomaine(trouve.domaine);
  const path = `/domaine/${slug}`;

  return (
    <CategorieLanding
      h1={`Stages ${trouve.domaine} au Maroc`}
      titre={`Stages ${trouve.domaine}`}
      canonicalPath={path}
      breadcrumb={[
        { nom: "Accueil", url: "/" },
        { nom: trouve.domaine, url: path },
      ]}
      intro={
        <p>
          Toutes les offres de stage en <strong>{trouve.domaine}</strong> au
          Maroc : PFE, pré-embauche, stages d&apos;été, dans toutes les villes.
          Nouvelles offres chaque jour.
        </p>
      }
      offres={offres}
    />
  );
}
