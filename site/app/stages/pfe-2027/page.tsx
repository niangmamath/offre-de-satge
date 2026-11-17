import type { Metadata } from "next";
import { connection } from "next/server";
import CategorieLanding from "@/components/CategorieLanding";
import { getOffresPFE2027 } from "@/lib/categories";

export const revalidate = 3600;

const PATH = "/stages/pfe-2027";

export const metadata: Metadata = {
  title: "Stages PFE 2026-2027 au Maroc — toutes les offres",
  description:
    "Offres de stage PFE (Projet de Fin d'Études) pour la campagne 2026-2027 au Maroc : informatique, data, ingénierie, finance, marketing, RH. Collectées en continu depuis LinkedIn et Rekrute.com.",
  keywords: [
    "stage PFE 2027",
    "stage PFE 2026-2027",
    "PFE Maroc",
    "offre de stage PFE",
    "campagne PFE 2027",
    "stage fin d'études Maroc",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "Stages PFE 2026-2027 au Maroc",
    description:
      "Toutes les offres PFE actives pour la campagne 2026-2027 au Maroc, mises à jour en continu.",
    url: PATH,
  },
};

export default async function PFE2027Page() {
  await connection();
  const offres = await getOffresPFE2027();

  return (
    <CategorieLanding
      h1="Stages PFE 2026-2027 au Maroc"
      titre="Stages PFE 2026-2027 au Maroc"
      canonicalPath={PATH}
      breadcrumb={[
        { nom: "Accueil", url: "/" },
        { nom: "Stages PFE 2027", url: PATH },
      ]}
      intro={
        <p>
          Toutes les offres de <strong>stage de fin d&apos;études (PFE)</strong>{" "}
          pour la campagne 2026-2027, agrégées depuis LinkedIn et Rekrute.
          Nouvelles offres ajoutées chaque jour, tous domaines confondus
          (informatique, data, ingénierie, finance, marketing, RH, audit).
        </p>
      }
      offres={offres}
      contexteFAQ={{ type: "pfe2027" }}
    />
  );
}
