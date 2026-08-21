import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/abonnes";

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const code = (body.code || "").trim();
  if (!email || !code) {
    return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
  }

  const result = await verifyOtp(email, code);

  switch (result.status) {
    case "ok":
      return NextResponse.json({ status: "ok" });
    case "wrong_code":
      return NextResponse.json({ error: "Code incorrect." }, { status: 400 });
    case "expired":
      return NextResponse.json(
        { error: "Ce code a expiré, redemandez-en un nouveau." },
        { status: 400 }
      );
    case "too_many_attempts":
      return NextResponse.json(
        { error: "Trop de tentatives, redemandez un nouveau code." },
        { status: 429 }
      );
    case "not_found":
      return NextResponse.json({ error: "Aucune inscription pour cette adresse." }, { status: 404 });
    case "db_unavailable":
      return NextResponse.json({ error: "Service indisponible, réessayez plus tard." }, { status: 503 });
  }
}
