import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { updateOffre, type OffreEditable } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { url?: string } & Partial<OffreEditable>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.url || !body.poste) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const champs: OffreEditable = {
    poste: body.poste,
    entite: body.entite || "",
    ville: body.ville || "",
    description: body.description || "",
    domaine: body.domaine || "Autre",
    type_stage: body.type_stage || "Non précisé",
    duree: body.duree || "",
    indemnite: body.indemnite || "",
  };

  const ok = await updateOffre(body.url, champs);
  if (!ok) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }
  return NextResponse.json({ status: "ok" });
}
