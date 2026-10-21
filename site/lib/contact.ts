// Partagé entre le formulaire (client) et /api/contact (serveur) : un
// fichier de route Next.js ne peut exporter que ses handlers HTTP.
export const SUJETS_CONTACT = [
  "Suggestion d'amélioration",
  "Signaler un problème",
  "Autre",
] as const;

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 3000;
