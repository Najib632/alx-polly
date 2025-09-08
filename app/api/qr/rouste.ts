import QRCode from "qrcode";
import { NextResponse } from "next/server";

export const runtime = "edge"; // Specifies that this route should run on the Edge Runtime

export async function GET(req: Request) {
  /**
   * Dynamically generates a QR code for a given poll's short code.
   *
   * @description
   * This API route handler is a crucial part of the application's sharing functionality.
   * Instead of just providing a URL to share, which can be cumbersome in physical settings
   * (like presentations, posters, or live events), this endpoint provides a scannable QR code.
   * Users can point their phone cameras at the QR code to be taken directly to the poll's voting page.
   *
   * This enhances the user experience by making poll sharing seamless in offline-to-online contexts.
   * It is designed to be called directly from an `<img>` tag in the frontend.
   *
   * @example
   * // In a frontend component (e.g., React with Next.js):
   * <img src={`/api/qr?code=${poll.short_code}`} alt="QR Code to vote" />
   *
   * @assumptions
   * - The application's public URL is correctly configured in the environment variables
   *   (`NEXT_PUBLIC_APP_URL` or `VERCEL_URL`). The fallback to `localhost:3000` is for development.
   * - The poll voting pages are accessible via the path structure `/p/[code]`.
   * - The request to this endpoint will be a GET request.
   *
   * @edge_cases
   * - If the `code` query parameter is missing in the request URL, the function will return a
   *   400 Bad Request response with an explanatory message.
   * - If the `qrcode` library fails to generate the SVG for any reason, the function will
   *   log the error and return a 500 Internal Server Error response.
   *
   * @param {Request} req - The incoming Next.js API request object. It is expected to
   *                        contain a `code` query parameter, e.g., `/api/qr?code=abcdef`.
   * @returns {Promise<NextResponse>} A promise that resolves to a `NextResponse` object.
   *                                  On success, it contains the QR code as an SVG image with the
   *                                  `image/svg+xml` content type and aggressive caching headers.
   *                                  On failure, it contains an error message and an appropriate
   *                                  HTTP status code.
   */
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
