import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { createManualOffre, type NouvelleOffre } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: Partial<NouvelleOffre>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.poste || !body.entite) {
    return NextResponse.json({ error: "Poste et entreprise requis" }, { status: 400 });
  }

  const offre: NouvelleOffre = {
    poste: body.poste,
    entite: body.entite,
    ville: body.ville || "",
    description: body.description || "",
    domaine: body.domaine || "Autre",
    type_stage: body.type_stage || "Non précisé",
    duree: body.duree || "",
    indemnite: body.indemnite || "",
  };

  try {
    const slug = await createManualOffre(offre);
    return NextResponse.json({ status: "ok", slug });
  } catch (e) {
    console.error("[admin/offres/creer]", e);
    return NextResponse.json({ error: "Échec de la création" }, { status: 500 });
  }
}
