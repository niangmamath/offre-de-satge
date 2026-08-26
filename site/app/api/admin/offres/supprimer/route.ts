import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { deleteOffre } from "@/lib/db";

export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!body.url) {
    return NextResponse.json({ error: "url requise" }, { status: 400 });
  }

  const ok = await deleteOffre(body.url);
  if (!ok) {
    return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
  }
  return NextResponse.json({ status: "ok" });
}
