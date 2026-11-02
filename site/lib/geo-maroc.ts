// Région administrative (découpage 2015) et code postal principal des villes
// rencontrées dans les offres, pour les données structurées JobPosting
// (Google Search Console : addressRegion / postalCode manquants). Code postal
// = code principal de la ville, omis quand il n'est pas connu avec certitude
// plutôt que d'en inventer un. Une ville absente garde seulement le pays.
type InfoVille = { region: string; codePostal?: string };

const CS = "Casablanca-Settat";
const RSK = "Rabat-Salé-Kénitra";
const TTA = "Tanger-Tétouan-Al Hoceïma";
const MS = "Marrakech-Safi";
const FM = "Fès-Meknès";
const SM = "Souss-Massa";
const OR = "Oriental";
const BK = "Béni Mellal-Khénifra";

const VILLES: Record<string, InfoVille> = {
  Casablanca: { region: CS, codePostal: "20000" },
  Mohammedia: { region: CS, codePostal: "28800" },
  Berrechid: { region: CS, codePostal: "26100" },
  Bouskoura: { region: CS, codePostal: "27182" },
  "El Jadida": { region: CS, codePostal: "24000" },
  Settat: { region: CS, codePostal: "26000" },
  Oualidia: { region: CS },
  Rabat: { region: RSK, codePostal: "10000" },
  Salé: { region: RSK, codePostal: "11000" },
  Témara: { region: RSK, codePostal: "12000" },
  Skhirat: { region: RSK, codePostal: "12050" },
  Kénitra: { region: RSK, codePostal: "14000" },
  Tanger: { region: TTA, codePostal: "90000" },
  Tétouan: { region: TTA, codePostal: "93000" },
  Marrakech: { region: MS, codePostal: "40000" },
  "Ben Guerir": { region: MS, codePostal: "43150" },
  Safi: { region: MS, codePostal: "46000" },
  Fès: { region: FM, codePostal: "30000" },
  Meknès: { region: FM, codePostal: "50000" },
  Agadir: { region: SM, codePostal: "80000" },
  Inchaden: { region: SM },
  Oujda: { region: OR, codePostal: "60000" },
  Nador: { region: OR, codePostal: "62000" },
  "Béni Mellal": { region: BK, codePostal: "23000" },
  Khouribga: { region: BK, codePostal: "25000" },
  Laâyoune: { region: "Laâyoune-Sakia El Hamra", codePostal: "70000" },
};

export function infoVille(ville: string | null): InfoVille | null {
  return ville ? (VILLES[ville] ?? null) : null;
}
