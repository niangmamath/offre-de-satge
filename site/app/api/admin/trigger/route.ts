import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";

const WORKFLOWS: Record<string, string> = {
  scrape: "scrape.yml",
  newsletter: "newsletter.yml",
};

// Dépôt fixe (pas une variable d'environnement) : ce bouton ne doit
// déclencher QUE le pipeline de ce projet, jamais un dépôt arbitraire --
// même s'il fallait un jour changer de dépôt, un token mal scope pourrait
// sinon être utilisé pour lancer des actions ailleurs.
const REPO = "niangmamath/offre-de-satge";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const workflow = WORKFLOWS[body.type || ""];
  if (!workflow) {
    return NextResponse.json({ error: "Type de déclenchement inconnu" }, { status: 400 });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN non configuré côté serveur." },
      { status: 503 }
    );
  }

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
    console.error("[admin/trigger] échec GitHub API:", res.status, detail);
    return NextResponse.json(
      { error: `GitHub a refusé le déclenchement (${res.status}).` },
      { status: 502 }
    );
  }

  return NextResponse.json({ status: "ok" });
}
