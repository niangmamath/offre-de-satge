import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { desabonnerParId } from "@/lib/abonnes";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const ok = await desabonnerParId(body.id);
  if (!ok) {
    return NextResponse.json({ error: "Abonné introuvable" }, { status: 404 });
  }
  return NextResponse.json({ status: "ok" });
}
