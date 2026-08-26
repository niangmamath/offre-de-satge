import type { Metadata } from "next";

// Défense en profondeur en plus du "disallow: /admin" dans robots.ts : même
// un moteur qui ignorerait robots.txt, ou une page déjà indexée avant cette
// exclusion, ne doit jamais apparaître dans les résultats de recherche.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
