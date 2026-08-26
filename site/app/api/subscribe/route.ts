import { NextResponse } from "next/server";
import { subscribe } from "@/lib/abonnes";
import { getTransport, fromAddress, logoSvg } from "@/lib/mailer";

async function envoyerCode(email: string, code: string) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[subscribe] SMTP non configuré — code de confirmation non envoyé.");
    return;
  }
  await transport.sendMail({
    from: fromAddress(),
    to: email,
    subject: `${code} — votre code de confirmation Stages au Maroc`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#4338ca;">${logoSvg("#4338ca")}Stages au Maroc</h2>
        <p>Voici votre code pour confirmer votre inscription à la newsletter (nouvelles offres chaque semaine) :</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;color:#4338ca;margin:20px 0;">${code}</p>
        <p style="color:#666;font-size:13px;">Ce code est valable 15 minutes. Saisissez-le sur la page où vous vous êtes inscrit(e).</p>
        <p style="color:#999;font-size:12px;">Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.</p>
      </div>`,
  });
}

// Champ honeypot ("site_web") : invisible pour un humain (CSS), rempli
// automatiquement par la plupart des bots de spam -> on ignore silencieusement
// sans révéler que c'est un piège.
export async function POST(request: Request) {
  let body: { email?: string; site_web?: string; domaine?: string };
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

  const result = await subscribe(email, body.domaine);

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
        await envoyerCode(email, result.code);
      } catch (e) {
        console.error("[subscribe] échec envoi du code:", e);
        return NextResponse.json(
          { error: "Inscription enregistrée mais le code n'a pas pu être envoyé." },
          { status: 502 }
        );
      }
      return NextResponse.json({ status: result.status });
  }
}
