import { connection } from "next/server";
import { getOffresParVille, getVillesAvecCompte } from "@/lib/categories";
import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-template";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Stages au Maroc";

export default async function Image({ params }: { params: { ville: string } }) {
  await connection();
  const villes = await getVillesAvecCompte();
  const trouve = villes.find((v) => v.slug === params.ville);
  if (!trouve) {
    return ogImageResponse({ titre: "Stages au Maroc", badge: "Veille continue" });
  }
  const offres = await getOffresParVille(trouve.ville);
  return ogImageResponse({
    titre: `Stages à ${trouve.ville}`,
    sousTitre: `${offres.length} offre${offres.length > 1 ? "s" : ""} active${offres.length > 1 ? "s" : ""}`,
    badge: "PFE · Pré-embauche · Été",
  });
}
