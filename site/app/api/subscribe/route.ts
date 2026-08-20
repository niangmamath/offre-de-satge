import { NextResponse } from "next/server";
import { subscribe } from "@/lib/abonnes";
import { getTransport, fromAddress } from "@/lib/mailer";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function envoyerConfirmation(email: string, token: string) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[subscribe] SMTP non configuré — email de confirmation non envoyé.");
    return;
  }
  const lien = `${siteUrl}/api/confirm?token=${token}`;
  await transport.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Confirmez votre inscription — Stages au Maroc",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#4338ca;">🎓 Stages au Maroc</h2>
        <p>Un clic pour confirmer votre inscription à la newsletter (nouvelles offres tous les 2 jours) :</p>
        <a href="${lien}" style="display:inline-block;margin:12px 0;background:linear-gradient(135deg,#4338ca,#7c3aed);color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:600;">
          Confirmer mon inscription
        </a>
        <p style="color:#999;font-size:12px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.</p>
      </div>`,
  });
}

// Champ honeypot ("site_web") : invisible pour un humain (CSS), rempli
// automatiquement par la plupart des bots de spam -> on ignore silencieusement
// sans révéler que c'est un piège.
export async function POST(request: Request) {
  let body: { email?: string; site_web?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (body.site_web) {
    return NextResponse.json({ status: "created" });
  }

  const email = (body.email || "").trim();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const result = await subscribe(email);

  switch (result.status) {
    case "invalid_email":
      return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
    case "db_unavailable":
      return NextResponse.json({ error: "Service indisponible, réessayez plus tard" }, { status: 503 });
    case "already_confirmed":
      return NextResponse.json({ status: "already_confirmed" });
    case "reactivated":
      return NextResponse.json({ status: "reactivated" });
    case "created":
    case "resent":
      try {
        await envoyerConfirmation(email, result.token);
      } catch (e) {
        console.error("[subscribe] échec envoi confirmation:", e);
        return NextResponse.json(
          { error: "Inscription enregistrée mais l'email de confirmation n'a pas pu être envoyé." },
          { status: 502 }
        );
      }
      return NextResponse.json({ status: result.status });
  }
}
