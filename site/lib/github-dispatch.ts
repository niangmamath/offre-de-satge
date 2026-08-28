// Déclenche un workflow GitHub Actions via workflow_dispatch. Utilisé par
// deux appelants : le bouton manuel de /admin ET les routes /api/cron/*
// (Vercel Cron, seul déclencheur vraiment fiable -- cf. commentaire dans
// vercel.json : le "schedule" natif de GitHub Actions est best-effort et
// peut être retardé de plusieurs heures, voire sauté, notamment lors
// d'incidents sur la plateforme).

export const WORKFLOWS = {
  scrape: "scrape.yml",
  newsletter: "newsletter.yml",
} as const;

export type WorkflowKey = keyof typeof WORKFLOWS;

// Dépôt fixe (pas une variable d'environnement) : ne doit déclencher QUE le
// pipeline de ce projet -- même si le dépôt change un jour, un token mal
// scope ne doit pas pouvoir être détourné pour lancer des actions ailleurs.
const REPO = "niangmamath/offre-de-satge";

export type DispatchResult = { ok: true } | { ok: false; status: number; erreur: string };

export async function declencherWorkflow(cle: WorkflowKey): Promise<DispatchResult> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return { ok: false, status: 503, erreur: "GITHUB_TOKEN non configuré côté serveur." };
  }

  const workflow = WORKFLOWS[cle];
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    console.error(`[github-dispatch] échec pour '${cle}':`, res.status, detail);
    return { ok: false, status: 502, erreur: `GitHub a refusé le déclenchement (${res.status}).` };
  }
  return { ok: true };
}
