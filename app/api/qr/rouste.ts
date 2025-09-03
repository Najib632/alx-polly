import QRCode from "qrcode";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Specifies that this route should run on the Edge Runtime

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code"); // The short_code for the poll

  if (!code) {
    return new NextResponse("Missing code parameter", { status: 400 });
  }

  // Construct the full URL that the QR code will encode
  // This assumes your app is deployed at process.env.NEXT_PUBLIC_APP_URL or similar.
  // For development, it will typically be http://localhost:3000
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
  const pollUrl = `${appUrl}/p/${code}`; // The short link to the poll

  try {
    // Generate the QR code as an SVG string
    const svg = await QRCode.toString(pollUrl, { type: "svg", margin: 1 });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000, immutable", // Cache the QR code aggressively
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return new NextResponse("Failed to generate QR code", { status: 500 });
  }
}
