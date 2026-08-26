import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/abonnes";
import { getTransport, fromAddress } from "@/lib/mailer";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

async function envoyerBienvenue(email: string, token: string) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[verify-otp] SMTP non configuré — email de bienvenue non envoyé.");
    return;
  }
  await transport.sendMail({
    from: fromAddress(),
    to: email,
    subject: "Bienvenue sur Stages au Maroc 🎓",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#4338ca,#7c3aed);padding:24px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">🎓 Bienvenue sur Stages au Maroc !</h1>
        </div>
        <div style="border:1px solid #eee;border-top:none;padding:20px 24px;border-radius:0 0 12px 12px;">
          <p>Votre inscription est confirmée. Vous recevrez désormais chaque semaine un email avec les nouvelles offres de stage détectées au Maroc, correspondant à vos préférences.</p>
          <p>En attendant le prochain envoi, vous pouvez déjà parcourir toutes les offres disponibles :</p>
          <a href="${siteUrl}" style="display:block;text-align:center;margin-top:16px;background:linear-gradient(135deg,#4338ca,#7c3aed);color:#fff;padding:12px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
            Voir les offres
          </a>
          <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;">
            Vous recevez ce mail car vous venez de vous abonner à la newsletter Stages au Maroc.<br>
            <a href="${siteUrl}/api/desabonner?token=${token}" style="color:#999;">Se désabonner</a>
          </p>
        </div>
      </div>`,
  });
}

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
      if (!result.dejaConfirme) {
        try {
          await envoyerBienvenue(email, result.token);
        } catch (e) {
          // Confirmation déjà actée en base -> ne jamais faire échouer la
          // requête pour un email de bienvenue qui n'a pas pu partir.
          console.error("[verify-otp] échec envoi de l'email de bienvenue:", e);
        }
      }
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
