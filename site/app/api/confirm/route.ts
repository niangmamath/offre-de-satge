import { NextResponse } from "next/server";
import { confirm } from "@/lib/abonnes";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const ok = token ? await confirm(token) : false;
  const dest = ok ? "/abonnement/confirme" : "/abonnement/erreur";
  return NextResponse.redirect(new URL(dest, request.url));
}
