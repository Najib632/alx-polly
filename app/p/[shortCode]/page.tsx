import { createClient } from "@/lib/supabase/server"; // Server-side Supabase client
import { cookies } from "next/headers"; // To get cookies for the server client
import { redirect } from "next/navigation"; // Next.js redirect function

export default async function ShortLinkRedirectPage({
  params,
}: {
  params: { shortCode: string };
}) {
  /**
   * ShortLinkRedirectPage: A server-side component that resolves a short URL
   * to its corresponding full poll page.
   *
   * @purpose This component provides a user-friendly sharing mechanism. Instead of
   * sharing a long, complex poll ID (UUID), users can share a short, memorable
   * link (e.g., `/s/abc123`). This page intercepts that request, looks up the
   * short code in the database, and redirects the user to the correct poll page.
   * This is essential for improving the shareability and overall user experience of the app.
   *
   * @assumptions
   * - This component is a dynamic route handler in a Next.js App Router setup, likely located at `app/s/[shortCode]/page.tsx`.
   * - A `polls` table exists in the Supabase database with a unique `short_code` column and a primary `id` column.
   * - The `createClient` utility correctly configures and returns a server-side Supabase client instance.
   *
   * @edge_cases
   * - If the `shortCode` is missing from the URL, the user is redirected to the homepage (`/`).
   * - If the provided `shortCode` does not match any record in the `polls` table, or if a database error occurs,
   *   the error is logged to the server console, and the user is redirected to the homepage.
   *
   * @connections
   * - **Receives from:** This page is the destination for any short link shared by users. The `short_code` itself is
   *   generated and associated with a poll ID during the poll creation process (e.g., on a `CreatePoll` form/page).
   * - **Redirects to:** After successfully finding the poll ID, it redirects the user to the main poll details page
   *   (e.g., `/polls/[pollId]`), where they can view details and vote.
   */
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const shortCode = params.shortCode;

  if (!shortCode) {
    // If no shortCode is provided, redirect to the home page or a 404 page.
    redirect("/");
  }

  // Query Supabase to find the poll ID associated with this short_code
  const { data: poll, error } = await supabase
    .from("polls")
    .select("id") // Only need the 'id' of the poll
    .eq("short_code", shortCode)
    .single(); // Expecting one poll or none

  if (error || !poll) {
    console.error(`Error finding poll for short code ${shortCode}:`, error);
    // If poll not found or an error occurs, redirect to home or a 404.
    redirect("/");
  }

  // Redirect to the full poll details page
  redirect(`/polls/${poll.id}`);
}
