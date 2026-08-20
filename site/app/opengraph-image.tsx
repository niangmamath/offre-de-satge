import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4338ca 0%, #7c3aed 55%, #a21caf 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: 80,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 110, marginBottom: 12, display: "flex" }}>🎓</div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -1, display: "flex" }}>
          Stages au Maroc
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: 24,
            color: "rgba(255,255,255,0.88)",
            display: "flex",
          }}
        >
          Toutes les offres de stage, tous domaines, mises à jour en continu
        </div>
      </div>
    ),
    { ...size }
  );
}
