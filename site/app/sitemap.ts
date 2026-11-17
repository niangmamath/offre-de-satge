import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getOffres } from "@/lib/db";
import {
  getVillesAvecCompte,
  getDomainesAvecCompte,
  getEntitesAvecCompte,
} from "@/lib/categories";
import { siteUrl } from "@/lib/site-url";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sans connection(), Next.js prérendrait ce sitemap une fois au build et
  // le servirait figé — les offres changent pourtant tous les jours,
  // indépendamment des déploiements du site.
  await connection();
  const [offres, villes, domaines, entites] = await Promise.all([
    getOffres().then((o) => o ?? []),
    getVillesAvecCompte(),
    getDomainesAvecCompte(),
    getEntitesAvecCompte(2),
  ]);
  const now = new Date();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/stages/pfe-2027`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/entreprises`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/politique-confidentialite`, changeFrequency: "yearly", priority: 0.3 },
    ...villes.map((v) => ({
      url: `${siteUrl}/stages/${v.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...domaines.map((d) => ({
      url: `${siteUrl}/domaine/${d.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...entites.map((e) => ({
      url: `${siteUrl}/entreprises/${e.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...offres.map((o) => ({
      url: `${siteUrl}/offre/${o.slug}`,
      lastModified: new Date(o.derniere_verification),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
