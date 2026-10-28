import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Adresse publique : cf. lib/site-url.ts.

const title = "Stages au Maroc — toutes les offres, tous domaines";
const description =
  "Veille automatisée des offres de stage au Maroc : PFE, pré-embauche, été, initiation, tous domaines confondus (informatique, ingénierie, finance, commerce, RH...). Mis à jour en continu, LinkedIn et Rekrute.com.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s · Stages au Maroc" },
  description,
  keywords: [
    "stage Maroc", "stage PFE Maroc", "offre de stage", "stagiaire Maroc",
    "stage pré-embauche Maroc", "stage été Maroc", "emploi stage étudiant",
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
  alternates: { canonical: "/" },
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
      </body>
    </html>
  );
}
