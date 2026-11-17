import { connection } from "next/server";
import { getOffres } from "@/lib/db";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 1800;

// Echappe les 5 caracteres interdits en XML. Les descriptions sont ensuite
// enveloppees dans un CDATA, donc seul le titre et l'URL passent par ici,
// mais on reste strict pour ne jamais produire un flux invalide.
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  await connection();
  const toutes = (await getOffres()) ?? [];
  const offres = toutes.slice(0, 50); // RSS 2.0 : convention 10-50 items

  const items = offres
    .map((o) => {
      const url = `${siteUrl}/offre/${o.slug}`;
      const pubDate = new Date(o.premiere_detection).toUTCString();
      const desc = (o.description ?? "").slice(0, 500);
      const cat = [o.ville, o.domaine, o.type_stage].filter(Boolean).join(" · ");
      return `    <item>
      <title>${xmlEscape(o.poste)}${o.entite ? ` — ${xmlEscape(o.entite)}` : ""}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      ${cat ? `<category>${xmlEscape(cat)}</category>` : ""}
      <description><![CDATA[${desc}]]></description>
    </item>`;
    })
    .join("\n");

  const maj = offres[0] ? new Date(offres[0].premiere_detection).toUTCString() : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Stages au Maroc — nouvelles offres</title>
    <link>${siteUrl}/</link>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Veille automatisée des offres de stage au Maroc : PFE, pré-embauche, été, tous domaines.</description>
    <language>fr-MA</language>
    <lastBuildDate>${maj}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
