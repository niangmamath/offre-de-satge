import { connection } from "next/server";
import { getOffresParDomaine, getDomainesAvecCompte } from "@/lib/categories";
import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-template";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Stages au Maroc";

export default async function Image({ params }: { params: { slug: string } }) {
  await connection();
  const domaines = await getDomainesAvecCompte();
  const trouve = domaines.find((d) => d.slug === params.slug);
  if (!trouve) {
    return ogImageResponse({ titre: "Stages au Maroc", badge: "Veille continue" });
  }
  const offres = await getOffresParDomaine(trouve.domaine);
  return ogImageResponse({
    titre: trouve.domaine,
    sousTitre: `${offres.length} stage${offres.length > 1 ? "s" : ""} au Maroc`,
    badge: "Par domaine",
  });
}
