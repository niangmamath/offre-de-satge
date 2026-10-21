"use client";

import { useCallback, useSyncExternalStore } from "react";

// Favoris stockés dans le navigateur du visiteur (pas de compte) : liste de
// slugs d'offres. localStorage peut être indisponible (navigation privée,
// stockage bloqué) -> chaque accès est protégé et le site marche sans.
const CLE = "favoris-offres";
const EVENEMENT = "favoris-change";
const VIDE: string[] = [];

let cache: { brut: string | null; valeur: string[] } = { brut: null, valeur: VIDE };

function lire(): string[] {
  let brut: string | null = null;
  try {
    brut = window.localStorage.getItem(CLE);
  } catch {
    return VIDE;
  }
  // Même référence tant que le contenu ne change pas (exigé par useSyncExternalStore).
  if (brut === cache.brut) return cache.valeur;
  let valeur: string[] = VIDE;
  try {
    const parse = brut ? JSON.parse(brut) : [];
    valeur = Array.isArray(parse) ? parse.filter((s): s is string => typeof s === "string") : VIDE;
  } catch {
    valeur = VIDE;
  }
  cache = { brut, valeur };
  return valeur;
}

function ecrire(slugs: string[]) {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(slugs));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel); // autres onglets
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

export function useFavoris() {
  const favoris = useSyncExternalStore(abonner, lire, () => VIDE);
  const basculer = useCallback((slug: string) => {
    const actuels = lire();
    ecrire(actuels.includes(slug) ? actuels.filter((s) => s !== slug) : [...actuels, slug]);
  }, []);
  return { favoris, basculer };
}
