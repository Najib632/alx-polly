import SignupForm from "@/components/auth/signup-form";

/**
 * Renders the user signup page for the application.
 *
 * @purpose This page serves as the primary entry point for new users to register for an
 * account. It provides a dedicated, full-screen view for the registration process,
 * ensuring a focused user experience without distractions from other UI elements. It's
 * a critical component of the user acquisition and authentication flow.
 *
 * @assumptions
 * - This component is used as a route-level page, likely within a framework like Next.js.
 * - The `SignupForm` component contains all the business logic, state management,
 *   and API interactions required for the user registration process. This page
 *   is purely a presentational container for that form.
 * - Routing logic elsewhere in the application will prevent already authenticated
 *   users from accessing this page, redirecting them to a dashboard or home page instead.
 *
 * @edge_cases
 * - If a logged-in user somehow navigates to this URL directly, the application's
 *   routing middleware is expected to handle the redirection. This component itself
 *   does not contain authentication checks.
 *
 * @connections
 * - **Child Component:** Renders the `<SignupForm />` component, which is the core
 *   interactive element of this page.
 * - **Routing:** This page is typically linked from a "Sign Up" button in the application's
 *   header, on the login page, or on marketing pages.
 * - **Post-Action Flow:** Upon successful registration within the `SignupForm`, the user
 *   will typically be redirected to another page, such as a "please verify your email"
 *   notice, the login page, or directly into the application's main dashboard. This
 *   redirection logic is handled by the `SignupForm` component.
 */
export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <SignupForm />
    </div>
  );
}
