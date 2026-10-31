import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, rgba(220,179,138,0.4), transparent 35%), linear-gradient(180deg, #101010 0%, #050505 100%)",
          color: "#f6e5d0",
          fontSize: 180,
          fontWeight: 700,
          borderRadius: 112,
          border: "12px solid rgba(185,121,86,0.45)",
        }}
      >
        NL
      </div>
    ),
    size,
  );
}
