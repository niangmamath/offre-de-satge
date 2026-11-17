import type { Offre } from "@/lib/db";

type Contexte =
  | { type: "ville"; nom: string }
  | { type: "domaine"; nom: string }
  | { type: "entreprise"; nom: string }
  | { type: "pfe2027" };

// Stats derivees des offres de la categorie, pour alimenter des Q/R
// concretes (pas de blabla generique : Google penalise les FAQ bidon).
function statsOffres(offres: Offre[]) {
  const n = offres.length;
  const entreprises = new Set(offres.map((o) => o.entite).filter(Boolean));
  const villes = new Set(offres.map((o) => o.ville).filter(Boolean));
  const avecIndemnite = offres.filter((o) => o.indemnite && o.indemnite.trim()).length;

  const compteur = <K extends keyof Offre>(cle: K) => {
    const c = new Map<string, number>();
    for (const o of offres) {
      const v = o[cle];
      if (typeof v !== "string" || !v) continue;
      c.set(v, (c.get(v) ?? 0) + 1);
    }
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  };

  const topEntreprises = compteur("entite").slice(0, 3);
  const topVilles = compteur("ville").slice(0, 3);
  const topDomaines = compteur("domaine").slice(0, 3);

  const nPFE = offres.filter(
    (o) =>
      (o.type_stage ?? "").toLowerCase().includes("pfe") ||
      (o.poste ?? "").toLowerCase().includes("pfe")
  ).length;

  return {
    n,
    nEntreprises: entreprises.size,
    nVilles: villes.size,
    avecIndemnite,
    pctIndemnite: n > 0 ? Math.round((avecIndemnite * 100) / n) : 0,
    topEntreprises,
    topVilles,
    topDomaines,
    nPFE,
  };
}

function enumerer(items: [string, number][]): string {
  if (items.length === 0) return "aucun recruteur identifie pour l'instant";
  const noms = items.map(([nom]) => nom);
  if (noms.length === 1) return noms[0];
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}

function construireQR(offres: Offre[], ctx: Contexte): { q: string; r: string }[] {
  const s = statsOffres(offres);

  if (ctx.type === "ville") {
    return [
      {
        q: `Combien d'offres de stage à ${ctx.nom} actuellement ?`,
        r:
          s.n === 0
            ? `Il n'y a aucune offre active à ${ctx.nom} pour le moment. Repassez dans quelques jours — nous collectons les nouvelles offres chaque jour.`
            : `Il y a ${s.n} offre${s.n > 1 ? "s" : ""} de stage active${s.n > 1 ? "s" : ""} à ${ctx.nom}, répartie${s.n > 1 ? "s" : ""} entre ${s.nEntreprises} recruteur${s.nEntreprises > 1 ? "s" : ""}.`,
      },
      {
        q: `Quelles entreprises recrutent le plus de stagiaires à ${ctx.nom} ?`,
        r: `Les principaux recruteurs à ${ctx.nom} sont ${enumerer(s.topEntreprises)}.`,
      },
      {
        q: `Les stages à ${ctx.nom} sont-ils rémunérés ?`,
        r:
          s.n === 0
            ? `Les offres précisent la rémunération quand elle est publiée par le recruteur.`
            : `Environ ${s.pctIndemnite}% des offres à ${ctx.nom} indiquent explicitement une indemnité (${s.avecIndemnite} sur ${s.n}). Les autres ne précisent pas la rémunération dans l'annonce originale — à confirmer avec le recruteur.`,
      },
      {
        q: `Quels domaines recrutent le plus à ${ctx.nom} ?`,
        r: `Les domaines les plus représentés à ${ctx.nom} sont ${enumerer(s.topDomaines)}.`,
      },
      {
        q: `Y a-t-il des stages PFE à ${ctx.nom} ?`,
        r:
          s.nPFE === 0
            ? `Aucune offre PFE actuellement listée à ${ctx.nom}, mais nous en ajoutons régulièrement.`
            : `Oui, ${s.nPFE} offre${s.nPFE > 1 ? "s" : ""} de stage PFE ${s.nPFE > 1 ? "sont" : "est"} actuellement disponible${s.nPFE > 1 ? "s" : ""} à ${ctx.nom}.`,
      },
    ];
  }

  if (ctx.type === "domaine") {
    return [
      {
        q: `Combien d'offres de stage en ${ctx.nom} au Maroc ?`,
        r:
          s.n === 0
            ? `Aucune offre active en ${ctx.nom} pour le moment.`
            : `Il y a ${s.n} offre${s.n > 1 ? "s" : ""} de stage en ${ctx.nom} au Maroc, dans ${s.nVilles} ville${s.nVilles > 1 ? "s" : ""}.`,
      },
      {
        q: `Dans quelles villes trouver un stage en ${ctx.nom} ?`,
        r: `Les villes qui concentrent le plus d'offres en ${ctx.nom} sont ${enumerer(s.topVilles)}.`,
      },
      {
        q: `Quelles entreprises recrutent en stage ${ctx.nom} ?`,
        r: `Les principaux recruteurs en ${ctx.nom} sont ${enumerer(s.topEntreprises)}.`,
      },
      {
        q: `Les stages en ${ctx.nom} sont-ils rémunérés ?`,
        r:
          s.n === 0
            ? `La rémunération dépend du recruteur.`
            : `Environ ${s.pctIndemnite}% des offres en ${ctx.nom} indiquent une indemnité.`,
      },
      {
        q: `Y a-t-il des stages PFE en ${ctx.nom} ?`,
        r:
          s.nPFE === 0
            ? `Aucune offre PFE en ${ctx.nom} listée actuellement.`
            : `Oui, ${s.nPFE} offre${s.nPFE > 1 ? "s" : ""} de PFE en ${ctx.nom} ${s.nPFE > 1 ? "sont" : "est"} disponible${s.nPFE > 1 ? "s" : ""}.`,
      },
    ];
  }

  if (ctx.type === "entreprise") {
    return [
      {
        q: `Combien d'offres de stage chez ${ctx.nom} ?`,
        r: `Il y a ${s.n} offre${s.n > 1 ? "s" : ""} de stage active${s.n > 1 ? "s" : ""} chez ${ctx.nom} au Maroc.`,
      },
      {
        q: `Dans quelles villes ${ctx.nom} recrute en stage ?`,
        r: `${ctx.nom} recrute principalement à ${enumerer(s.topVilles)}.`,
      },
      {
        q: `Quels types de stages chez ${ctx.nom} ?`,
        r: `${ctx.nom} propose des stages en ${enumerer(s.topDomaines)}.`,
      },
      {
        q: `${ctx.nom} propose-t-il des stages PFE ?`,
        r:
          s.nPFE === 0
            ? `Aucune offre PFE listée chez ${ctx.nom} actuellement.`
            : `Oui, ${s.nPFE} offre${s.nPFE > 1 ? "s" : ""} de PFE ${s.nPFE > 1 ? "sont" : "est"} disponible${s.nPFE > 1 ? "s" : ""} chez ${ctx.nom}.`,
      },
    ];
  }

  // pfe2027
  return [
    {
      q: "Combien d'offres de stage PFE 2026-2027 au Maroc ?",
      r: `Il y a actuellement ${s.n} offre${s.n > 1 ? "s" : ""} de stage PFE pour la campagne 2026-2027 au Maroc, chez ${s.nEntreprises} recruteur${s.nEntreprises > 1 ? "s" : ""} différent${s.nEntreprises > 1 ? "s" : ""}.`,
    },
    {
      q: "Quelles entreprises recrutent pour la campagne PFE 2027 ?",
      r: `Les principaux recruteurs PFE 2027 sont ${enumerer(s.topEntreprises)}.`,
    },
    {
      q: "Dans quelles villes se déroulent les stages PFE 2027 ?",
      r: `Les stages PFE 2027 se concentrent à ${enumerer(s.topVilles)}.`,
    },
    {
      q: "Quels domaines recrutent pour les PFE 2027 ?",
      r: `Les PFE 2027 couvrent principalement ${enumerer(s.topDomaines)}.`,
    },
    {
      q: "Quand faut-il postuler pour un PFE 2027 ?",
      r: "La plupart des campagnes PFE pour l'année académique 2026-2027 s'ouvrent entre septembre 2026 et février 2027. Les offres sont ajoutées sur ce site au fur et à mesure de leur publication.",
    },
  ];
}

export default function CategorieFAQ({
  offres,
  contexte,
}: {
  offres: Offre[];
  contexte: Contexte;
}) {
  const qr = construireQR(offres, contexte);
  if (qr.length === 0 || offres.length === 0) return null;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qr.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.r },
    })),
  };

  return (
    <section className="mt-10 border-t border-gray-100 pt-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <h2 className="text-lg font-semibold text-gray-900">Questions fréquentes</h2>
      <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {qr.map((item, i) => (
          <details key={i} className="group p-4 open:bg-gray-50">
            <summary className="cursor-pointer list-none text-sm font-medium text-gray-900 marker:hidden">
              <span className="mr-2 text-indigo-600 group-open:rotate-90 inline-block transition">▸</span>
              {item.q}
            </summary>
            <p className="mt-2 pl-5 text-sm text-gray-600">{item.r}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
