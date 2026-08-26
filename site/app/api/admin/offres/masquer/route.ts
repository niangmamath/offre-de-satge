import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { setMasque } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { url?: string; masque?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.url || typeof body.masque !== "boolean") {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const ok = await setMasque(body.url, body.masque);
  if (!ok) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }
  return NextResponse.json({ status: "ok" });
}
