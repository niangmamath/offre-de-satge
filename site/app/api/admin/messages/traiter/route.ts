import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { marquerTraite } from "@/lib/messages";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { id?: number; traite?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const ok = await marquerTraite(body.id, body.traite !== false);
  if (!ok) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }
  return NextResponse.json({ status: "ok" });
}
