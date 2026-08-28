import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { declencherWorkflow, WORKFLOWS, type WorkflowKey } from "@/lib/github-dispatch";

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

  const cle = body.type as WorkflowKey;
  if (!cle || !(cle in WORKFLOWS)) {
    return NextResponse.json({ error: "Type de déclenchement inconnu" }, { status: 400 });
  }

  const result = await declencherWorkflow(cle);
  if (!result.ok) {
    return NextResponse.json({ error: result.erreur }, { status: result.status });
  }
  return NextResponse.json({ status: "ok" });
}
