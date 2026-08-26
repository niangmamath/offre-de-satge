// Même taxonomie que classifier.DOMAINE_KW (Python) -- dupliquée ici car le
// site (TypeScript) et le pipeline (Python) sont deux runtimes séparés sans
// import partagé. À tenir synchronisé si la liste change côté classifier.py.
//
// Module séparé de lib/abonnes.ts (qui importe `pg`) : NewsletterForm.tsx
// est un composant client et ne doit jamais entraîner `pg` (Node-only,
// incompatible navigateur) dans le bundle client.
export const DOMAINES_NEWSLETTER = [
  "Informatique / Data",
  "Ingénierie / Industrie",
  "Finance / Comptabilité",
  "Commerce / Marketing / Vente",
  "Logistique / Transport / Achats",
  "RH",
  "Juridique",
  "Santé",
  "Autre",
];
