import LoginForm from "@/components/auth/login-form";

/**
 * Renders the main login page for the application.
 *
 * @description
 * This component serves as a simple, centered layout container for the `LoginForm`.
 * Its primary purpose is to provide a dedicated route and view for users to sign in.
 *
 * @why
 * This page is a crucial part of the authentication flow. It acts as the
 * authentication gateway for unauthenticated users trying to access protected areas
 * of the application. By centralizing the login UI on a specific route, we can
 * easily manage redirects and provide a clear entry point for users.
 *
 * @assumptions
 * - The `<LoginForm />` component handles all aspects of the authentication
 *   process, including form state, validation, API calls, and error/success
 *   feedback.
 * - Routing is set up (e.g., in Next.js App Router) to render this page
 *   at a specific path, like `/login` or `/auth/login`.
 * - Global styles and a base layout (if any) are applied by a parent layout
 *   component.
 *
 * @edge_cases
 * - **Authenticated Users:** If an already authenticated user navigates to this
 *   URL, they should ideally be redirected away to a dashboard or home page.
 *   This redirection logic is typically handled by routing middleware, not within
 *   this component itself.
 *
 * @connections
 * - **`@/components/auth/login-form`**: This is the child component that contains
 *   the actual form fields and submission logic. `LoginPage` is merely its host.
 * - **Routing Middleware**: Works in tandem with middleware that protects routes
 *   and redirects unauthenticated users to this page.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
