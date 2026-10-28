import { NextResponse } from "next/server";
import { estAuthentifie } from "@/lib/admin";
import { getAbonneActifParId } from "@/lib/abonnes";
import { getTransport, fromAddress, logoSvg } from "@/lib/mailer";
import { siteUrl } from "@/lib/site-url";


const SUJET_MAX = 150;
const MESSAGE_MAX = 5000;

function echapper(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Message libre de l'admin à UN abonné actif (confirmé ou en attente).
export async function POST(request: Request) {
  if (!(await estAuthentifie())) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { id?: number; sujet?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const sujet = (body.sujet || "").trim();
  const message = (body.message || "").trim();
  if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  if (!sujet || sujet.length > SUJET_MAX) {
    return NextResponse.json({ error: `Objet requis (${SUJET_MAX} caractères max).` }, { status: 400 });
  }
  if (!message || message.length > MESSAGE_MAX) {
    return NextResponse.json({ error: `Message requis (${MESSAGE_MAX} caractères max).` }, { status: 400 });
  }

  const abonne = await getAbonneActifParId(body.id);
  if (!abonne) {
    return NextResponse.json({ error: "Abonné introuvable ou désabonné." }, { status: 404 });
  }

  const transport = getTransport();
  if (!transport) {
    return NextResponse.json({ error: "SMTP non configuré côté serveur." }, { status: 503 });
  }

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: abonne.email,
      subject: sujet,
      text: `${message}\n\n--\nStages au Maroc — ${siteUrl}\nSe désabonner : ${siteUrl}/api/desabonner?token=${abonne.token}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
          <div style="background:linear-gradient(135deg,#4338ca,#7c3aed);padding:20px 24px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:20px;">${logoSvg("#ffffff")}Stages au Maroc</h1>
          </div>
          <div style="border:1px solid #eee;border-top:none;padding:20px 24px;border-radius:0 0 12px 12px;">
            <div style="white-space:pre-wrap;color:#222;font-size:14px;line-height:1.5;">${echapper(message)}</div>
            <a href="${abonne.confirme ? siteUrl : `${siteUrl}/#newsletter`}" style="display:block;text-align:center;margin-top:20px;background:linear-gradient(135deg,#4338ca,#7c3aed);color:#fff;padding:12px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;">
              ${abonne.confirme ? "Voir les offres" : "Me réinscrire"}
            </a>
            <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;">
              ${
                abonne.confirme
                  ? "Vous recevez ce mail car vous êtes abonné(e) à la newsletter Stages au Maroc."
                  : "Vous recevez ce mail car vous avez commencé une inscription à la newsletter Stages au Maroc."
              }<br>
              <a href="${siteUrl}/api/desabonner?token=${abonne.token}" style="color:#999;">Se désabonner</a>
            </p>
          </div>
        </div>`,
    });
  } catch (e) {
    console.error("[admin/abonnes/message] échec envoi:", e);
    return NextResponse.json({ error: "L'envoi a échoué (SMTP)." }, { status: 502 });
  }

  return NextResponse.json({ status: "ok" });
}
