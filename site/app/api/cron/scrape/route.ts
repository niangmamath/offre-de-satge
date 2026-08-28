import { NextResponse } from "next/server";
import { declencherWorkflow } from "@/lib/github-dispatch";

// Appelé par Vercel Cron (vercel.json), pas par GitHub Actions : le
// "schedule" natif de GitHub s'est révélé peu fiable en pratique (retards
// de plusieurs heures, voire runs sautés lors d'incidents sur leur
// plateforme -- cf. historique du 26-28/08/2026). Vercel Cron sert donc
// uniquement de "réveil" fiable ; le travail long (scraping, jusqu'à
// ~2h) continue de tourner sur GitHub Actions, hors des limites de durée
// des fonctions serverless Vercel.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await declencherWorkflow("scrape");
  if (!result.ok) {
    return NextResponse.json({ error: result.erreur }, { status: result.status });
  }
  return NextResponse.json({ status: "ok" });
}
