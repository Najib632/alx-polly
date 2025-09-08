import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for Supabase Session Management.
 *
 * Why this is needed:
 * -------------------
 * The Next.js App Router uses Server Components by default. Server Components are
 * rendered on the server and do not have access to the browser's cookie store in the
 * same way Client Components do. This creates a challenge for managing user sessions,
 * as the server needs a reliable way to know who the user is for any given request.
 *
 * This middleware solves this by running on the server for each incoming request. Its
 * primary responsibility is to ensure the user's session is refreshed and up-to-date
 * *before* the request is handed over to a Server Component for rendering.
 *
 * How it works:
 * -------------
 * 1.  It intercepts requests that match the `config.matcher` pattern.
 * 2.  It creates a server-side Supabase client (`createServerClient`) specifically
 *     for the context of the current request.
 * 3.  It provides custom `getAll` and `setAll` handlers for cookie management:
 *     - `getAll`: Reads cookies from the incoming `NextRequest`.
 *     - `setAll`: When Supabase needs to set or update cookies (e.g., after a
 *       token refresh), this function writes them to the outgoing `NextResponse`.
 *       Crucially, it also updates the cookies on the `request` object itself,
 *       ensuring that any Server Component further down the chain receives the
 *       most up-to-date session information.
 * 4.  The call to `await supabase.auth.getUser()` is the trigger. It inspects the
 *     cookies for a session. If the access token is expired, it will automatically
 *     use the refresh token to get a new one. This process invokes the `setAll`
 *     handler if a new session is established.
 * 5.  Finally, it returns a `NextResponse`, which either contains the original
 *     headers or the updated ones with the new session cookies.
 *
 * Connection to other components:
 * -------------------------------
 * - **Server Components**: This middleware is essential for Server Components that
 *   perform authenticated actions. By ensuring the session is fresh, it allows
 *   Server Components to confidently call `supabase.auth.getUser()` and get the
 *   correct user data without worrying about expired tokens.
 * - **Route Handlers**: The same logic applies. Authenticated API routes will
 *   receive a valid session.
 * - **Client Components**: By sending the updated session cookie back to the
 *   browser, it ensures that the client-side Supabase instance also stays in sync.
 *
 * Assumptions & Edge Cases:
 * -------------------------
 * - Assumes `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are
 *   correctly set in the environment variables.
 * - The `config.matcher` is critical. It should be configured to run on all
 *   paths that require authentication while excluding static assets and public
 *   pages to avoid unnecessary overhead.
 * - If a user's refresh token is also invalid or revoked, the session will not be
 *   refreshed. `supabase.auth.getUser()` will return a null user, and subsequent
 *   protected routes will correctly deny access. This is the expected behavior.
 */
export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path)
     * - /login (the login page)
     * - /signup (the signup page)
     */
    "/((?!_next/static|_next/image|favicon.ico|$|login|signup).*)",
  ],
};
