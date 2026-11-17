import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

// Google AdSense — publisher client ID. Chargé en afterInteractive pour
// ne pas bloquer le first paint, et avec `crossOrigin="anonymous"` tel
// que requis par la doc AdSense. Un seul chargement du script par page
// grâce à l'id partagé.
const ADSENSE_CLIENT = "ca-pub-7092087136703483";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Adresse publique : cf. lib/site-url.ts.

const title = "Stages au Maroc — offres PFE 2026-2027, pré-embauche, été";
const description =
  "Veille automatisée des offres de stage au Maroc : PFE 2026-2027, pré-embauche, stages d'été et initiation. Toutes villes (Casablanca, Rabat, Tanger, Marrakech, Agadir, Fès) et tous domaines (informatique, data, ingénierie, finance, marketing, RH, audit). Mis à jour en continu depuis LinkedIn et Rekrute.com.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · Stages au Maroc" },
  description,
  keywords: [
    "stage Maroc", "stage PFE Maroc", "stage PFE 2027", "stage PFE 2026-2027",
    "offre de stage", "stagiaire Maroc", "stage pré-embauche Maroc",
    "stage été Maroc", "emploi stage étudiant",
    "stage Casablanca", "stage Rabat", "stage Tanger", "stage Marrakech",
  ],
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "Stages au Maroc",
    locale: "fr_MA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/feed.xml" },
  },
  // Meta tag dedie a la verification du compte AdSense. Complement du
  // script adsbygoogle.js (ci-dessous dans <body>) — AdSense cherche
  // l'un OU l'autre lors de la validation initiale du site ; avoir les
  // deux evite les faux negatifs quand le crawler arrive avant que le
  // JS externe soit injecte par Next.
  other: { "google-adsense-account": "ca-pub-7092087136703483" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
        <Script
          id="adsbygoogle-loader"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
