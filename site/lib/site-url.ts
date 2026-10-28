// Adresse publique du site (liens des mails, sitemap, canonical, robots).
// Ordre : NEXT_PUBLIC_SITE_URL si on la définit (futur nom de domaine), puis
// VERCEL_PROJECT_PRODUCTION_URL (domaine de production STABLE, fourni par
// Vercel). Surtout pas VERCEL_URL seul : c'est l'adresse temporaire du
// déploiement (offre-de-satge-xxxx-...vercel.app), qui change à chaque push
// et s'est retrouvée dans le sitemap, le canonical et les liens des mails.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
