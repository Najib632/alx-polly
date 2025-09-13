import type { Metadata } from "next";
import "./globals.css";
import { createClient } from "@/lib/supabase/server"; // Import server client
import { cookies } from "next/headers"; // Import cookies
import { QueryProvider } from "@/lib/providers";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Polly - Create Engaging Polls & Gather Real Insights",
  description: "Create beautiful, interactive polls to gather real insights from your audience. Share anywhere, track results in real-time, and make data-driven decisions.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /**
   * The root layout for the entire application.
   *
   * @description
   * This is a server-side component that wraps every page. Its primary responsibilities
   * are to provide a consistent UI shell (HTML structure, fonts, header), set up global
   * context providers, and handle server-side user authentication checks.
   *
   * Why this is an `async` component:
   * It needs to fetch the current user's session from Supabase on the server before
   * rendering the page. This allows the UI, particularly the header, to be tailored
   * based on the user's authentication status without a client-side loading flicker.
   *
   * How it connects to other components:
   * - `QueryProvider`: It wraps the `children` with this provider, making a TanStack Query
   *   client available to all client components throughout the app for data fetching.
   * - `LogoutButton`: It conditionally renders this client component in the header if a
   *   user is authenticated, allowing them to sign out.
   * - Page Components (`children`): It acts as the parent for all page components,
   *   providing the common layout structure and global context.
   *
   * @param {object} props - The props for the component.
   * @param {React.ReactNode} props.children - The page component to be rendered within the layout.
   *
   * @assumptions
   * - Supabase environment variables are correctly configured for the server client.
   * - The `QueryProvider` correctly initializes and provides a TanStack Query client.
   *
   * @edge_cases
   * - If the Supabase `getUser()` call fails or if the user's session is invalid/expired,
   *   the `user` object will be null. The component handles this gracefully by displaying
   *   Login and Sign Up links instead of the authenticated user's view.
   */
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser(); // Fetch user

  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <Navbar user={user} />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
