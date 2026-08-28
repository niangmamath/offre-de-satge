import { NextResponse } from "next/server";
import { declencherWorkflow } from "@/lib/github-dispatch";

// Même principe que /api/cron/scrape -- Vercel Cron comme déclencheur
// fiable, le travail réel reste sur GitHub Actions.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await declencherWorkflow("newsletter");
  if (!result.ok) {
    return NextResponse.json({ error: result.erreur }, { status: result.status });
  }
  return NextResponse.json({ status: "ok" });
}
