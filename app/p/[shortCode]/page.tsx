import { createClient } from "@/lib/supabase/server"; // Server-side Supabase client
import { cookies } from "next/headers"; // To get cookies for the server client
import { redirect } from "next/navigation"; // Next.js redirect function

// This is a Server Component, so it runs on the server.
export default async function ShortLinkRedirectPage({
  params,
}: {
  params: { shortCode: string };
}) {
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
