"use client";

import { useFavoris } from "@/lib/favoris";

export default function FavoriButton({
  slug,
  className = "",
  avecTexte = false,
}: {
  slug: string;
  className?: string;
  avecTexte?: boolean;
}) {
  const { favoris, basculer } = useFavoris();
  const actif = favoris.includes(slug);
  const libelle = actif ? "Retirer des favoris" : "Ajouter aux favoris";

  return (
    <button
      type="button"
      aria-pressed={actif}
      aria-label={libelle}
      title={libelle}
      onClick={(e) => {
        // Le bouton est dans le lien de la carte : ne pas ouvrir l'offre.
        e.preventDefault();
        e.stopPropagation();
        basculer(slug);
      }}
      className={`inline-flex items-center gap-1.5 rounded-full transition ${
        actif ? "text-amber-500" : "text-gray-300 hover:text-amber-400"
      } ${className}`}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={actif ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinejoin="round"
          d="M12 3.5l2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 16.9l-5.25 2.76 1-5.86L3.5 9.66l5.9-.86L12 3.5z"
        />
      </svg>
      {avecTexte ? <span className="text-sm font-medium">{actif ? "Dans vos favoris" : "Sauvegarder"}</span> : null}
    </button>
  );
}
