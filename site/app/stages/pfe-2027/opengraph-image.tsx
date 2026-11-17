import { connection } from "next/server";
import { getOffresPFE2027 } from "@/lib/categories";
import { ogImageResponse, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-template";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Stages PFE 2026-2027 au Maroc";

export default async function Image() {
  await connection();
  const offres = await getOffresPFE2027();
  return ogImageResponse({
    titre: "PFE 2026-2027",
    sousTitre: offres.length > 0 ? `${offres.length} offres au Maroc` : "Campagne en cours",
    badge: "Campagne PFE",
  });
}
