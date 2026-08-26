"use client";

import { useState } from "react";

export default function ShareButton({ titre, url }: { titre: string; url: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titre, url });
        return;
      } catch {
        // Annulé par l'utilisateur ou API indisponible -> repli copier-coller.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permissions...) -> ignore silencieusement.
    }
  }

  return (
    <button
      type="button"
      onClick={partager}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
    >
      {copie ? (
        "✓ Lien copié !"
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342a3 3 0 100-2.684m0 2.684a3 3 0 100 2.684m0-2.684l6.632 3.316m0-6.632a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 6.632a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
          Partager cette offre
        </>
      )}
    </button>
  );
}
