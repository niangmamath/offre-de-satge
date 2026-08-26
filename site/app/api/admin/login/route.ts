import { NextResponse } from "next/server";
import { login, COOKIE_NAME, SESSION_DUREE_MS } from "@/lib/admin";

export async function POST(request: Request) {
  let body: { motDePasse?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const motDePasse = (body.motDePasse || "").trim();
  if (!motDePasse) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const result = await login(motDePasse);
  if (!result.ok) {
    return NextResponse.json({ error: result.erreur }, { status: 401 });
  }

  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_DUREE_MS / 1000),
  });
  return res;
}
