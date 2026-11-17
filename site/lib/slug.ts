// Slugifie une valeur libre (ville, domaine, entite) pour en faire un
// segment d'URL stable. Volontairement simple : on ne garde que [a-z0-9-],
// pas de hash (contrairement a db.ts:slugify) car ces slugs servent de
// canonique pour Google — on veut qu'ils soient lisibles et devinables.
export function slugifyLibre(valeur: string): string {
  return valeur
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
