import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Template commun pour les OG images dynamiques des pages de categorie
// (ville, domaine, entreprise, campagne). On garde la zone sure centrale
// 630x630 pour que WhatsApp/Telegram/Discord qui recadrent carre n'amputent
// rien d'important. Signature simple : un titre fort + un chiffre + une
// mention "Stages au Maroc" en pied.
export function ogImageResponse({
  titre,
  sousTitre,
  badge,
}: {
  titre: string;
  sousTitre?: string;
  badge?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #a21caf 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 950,
            height: 560,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "0 40px",
          }}
        >
          {badge ? (
            <div
              style={{
                display: "flex",
                padding: "10px 26px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.18)",
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 600,
                marginBottom: 28,
              }}
            >
              {badge}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              fontSize: titre.length > 30 ? 72 : 90,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -1,
              lineHeight: 1.05,
            }}
          >
            {titre}
          </div>

          {sousTitre ? (
            <div
              style={{
                display: "flex",
                fontSize: 36,
                fontWeight: 500,
                color: "rgba(255,255,255,0.88)",
                marginTop: 24,
              }}
            >
              {sousTitre}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 50,
              color: "rgba(255,255,255,0.75)",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 4.5-9 4.5-9-4.5L12 3z" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 10.2v4.3c0 1.5 2.46 3 5.5 3s5.5-1.5 5.5-3v-4.3"
              />
            </svg>
            Stages au Maroc
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
