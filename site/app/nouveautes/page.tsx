import type { Metadata } from "next";
import { connection } from "next/server";
import { getOffres } from "@/lib/db";
import CategorieLanding from "@/components/CategorieLanding";

export const revalidate = 1800;

const PATH = "/nouveautes";

export const metadata: Metadata = {
  title: "Nouvelles offres de stage au Maroc — 7 derniers jours",
  description:
    "Toutes les offres de stage publiées cette semaine au Maroc : PFE, pré-embauche, été, tous domaines. Collectées en continu depuis LinkedIn et Rekrute.",
  keywords: [
    "nouveaux stages Maroc",
    "offres de stage récentes",
    "stages cette semaine Maroc",
    "stage PFE 2027 nouveau",
  ],
  alternates: { canonical: PATH, types: { "application/rss+xml": "/feed.xml" } },
};

export default async function NouveautesPage() {
  await connection();
  const toutes = (await getOffres()) ?? [];

  // Filtre sur 7 jours glissants, sur premiere_detection (date d'apparition
  // sur le site, pas date_pub du recruteur qui peut etre ancienne pour
  // une offre que Rekrute republie).
  const il7jours = Date.now() - 7 * 24 * 3600 * 1000;
  const offres = toutes.filter((o) => {
    const t = new Date(o.premiere_detection).getTime();
    return !Number.isNaN(t) && t >= il7jours;
  });

  return (
    <CategorieLanding
      h1="Nouvelles offres de stage · 7 derniers jours"
      titre="Nouveautés — Stages au Maroc"
      canonicalPath={PATH}
      breadcrumb={[
        { nom: "Accueil", url: "/" },
        { nom: "Nouveautés", url: PATH },
      ]}
      intro={
        <p>
          Les <strong>{offres.length} offres</strong> de stage ajoutées à notre
          base durant les 7 derniers jours, tous domaines et toutes villes
          confondus. Un <a href="/feed.xml" className="underline hover:text-white">flux RSS</a>{" "}
          est disponible pour recevoir les nouvelles offres dans votre lecteur favori.
        </p>
      }
      offres={offres}
    />
  );
}
