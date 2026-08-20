import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getOffres } from "@/lib/db";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sans connection(), Next.js prérendrait ce sitemap une fois au build et
  // le servirait figé — les offres changent pourtant tous les jours,
  // indépendamment des déploiements du site.
  await connection();
  const offres = (await getOffres()) ?? [];

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "hourly", priority: 1 },
    ...offres.map((o) => ({
      url: `${siteUrl}/offre/${o.slug}`,
      lastModified: new Date(o.derniere_verification),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
