import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import CategorieLanding from "@/components/CategorieLanding";
import {
  getEntitesAvecCompte,
  getEntiteParSlug,
  getOffresParEntite,
} from "@/lib/categories";

export const revalidate = 3600;

type Params = Promise<{ slug: string }>;

// Pas de generateStaticParams : les 50+ pre-rendus se faisaient tous en
// parallele au build et saturaient Neon (free tier -> timeout 60s par page
// a repetition). ISR a la volee : premier hit = 1-2s (chaud ensuite 1h).
// Google decouvre les URLs via le sitemap, la couverture reste identique.

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const nom = await getEntiteParSlug(slug);
  if (!nom) return { title: "Entreprise introuvable" };

  const path = `/entreprises/${slug}`;
  return {
    title: `Stages chez ${nom} au Maroc — offres actives`,
    description: `Toutes les offres de stage actives chez ${nom} au Maroc : PFE, pré-embauche, été. Mises à jour en continu.`,
    keywords: [
      `stage ${nom}`,
      `${nom} stage Maroc`,
      `${nom} recrutement stage`,
      `${nom} PFE`,
    ],
    alternates: { canonical: path },
    openGraph: {
      title: `Stages chez ${nom} au Maroc`,
      description: `Offres de stage actives chez ${nom}.`,
      url: path,
    },
  };
}

export default async function EntreprisePage({ params }: { params: Params }) {
  await connection();
  const { slug } = await params;
  const nom = await getEntiteParSlug(slug);
  if (!nom) notFound();

  const offres = await getOffresParEntite(nom);
  const path = `/entreprises/${slug}`;

  return (
    <CategorieLanding
      h1={`Stages chez ${nom}`}
      titre={`Stages chez ${nom}`}
      canonicalPath={path}
      breadcrumb={[
        { nom: "Accueil", url: "/" },
        { nom: "Entreprises", url: "/entreprises" },
        { nom, url: path },
      ]}
      intro={
        <p>
          Toutes les offres de stage actives chez <strong>{nom}</strong> au
          Maroc, mises à jour en continu depuis LinkedIn et Rekrute.
        </p>
      }
      offres={offres}
      contexteFAQ={{ type: "entreprise", nom }}
    />
  );
}
