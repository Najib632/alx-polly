import { redirect } from "next/navigation";

/**
 * The root page component for the application.
 *
 * @remarks
 * This component serves as the primary entry point when a user navigates to the
 * root URL (e.g., "https://yourapp.com/"). Its sole purpose is to redirect the
 * user to the main content area of the site, which is the polls listing page.
 *
 * Why this is needed:
 * The application does not have a dedicated "home" or "landing" page with unique
 * content. Instead of showing a blank page or duplicating content, we immediately
 * forward users to the `/polls` route, which is considered the functional homepage.
 * This provides a smoother user experience by taking them directly to the app's
 * core functionality.
 *
 * How it works:
 * As a Next.js Server Component, it executes on the server. Upon being invoked
 * for a request to the root path, it calls the `redirect` function from
 * `next/navigation`, which triggers an HTTP 307 (Temporary Redirect) response,
 * instructing the browser to navigate to `/polls`. No UI is ever rendered by this
 * component.
 *
 * Assumptions:
 * - The route `/polls` exists and is handled by another page component (e.g.,
 *   `app/polls/page.tsx`).
 * - This component is located at `app/page.tsx` to correctly handle the root route
 *   in a Next.js App Router project.
 *
 * Edge Cases:
 * - If the `/polls` route is ever removed or becomes unavailable, this redirect
 *   will lead users to a 404 Not Found error page.
 *
 * Connections to other components:
 * - This component is a pure router. It doesn't render UI but directly hands off
 *   control to the page component responsible for the `/polls` route, effectively
 *   making that component the default view for the entire application.
 */
export default function HomePage() {
  redirect("/polls");
}
