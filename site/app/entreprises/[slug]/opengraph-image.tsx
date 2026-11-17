import { connection } from "next/server";
import { getEntiteParSlug, getOffresParEntite } from "@/lib/categories";
import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-template";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Stages au Maroc";

export default async function Image({ params }: { params: { slug: string } }) {
  await connection();
  const nom = await getEntiteParSlug(params.slug);
  if (!nom) {
    return ogImageResponse({ titre: "Stages au Maroc", badge: "Veille continue" });
  }
  const offres = await getOffresParEntite(nom);
  return ogImageResponse({
    titre: nom,
    sousTitre: `${offres.length} stage${offres.length > 1 ? "s" : ""} actif${offres.length > 1 ? "s" : ""} au Maroc`,
    badge: "Entreprise qui recrute",
  });
}
