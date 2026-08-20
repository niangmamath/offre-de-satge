import { NextResponse } from "next/server";
import { unsubscribe } from "@/lib/abonnes";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const ok = token ? await unsubscribe(token) : false;
  const dest = ok ? "/abonnement/desabonne" : "/abonnement/erreur";
  return NextResponse.redirect(new URL(dest, request.url));
}
