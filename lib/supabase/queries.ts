"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Database } from "@/lib/types";

/**
 * Creates and returns a Supabase client instance for server-side operations.
 *
 * ### Description
 * This function provides a Supabase client that is authenticated using the user's
 * session cookie. It is essential for performing any user-specific operations
 * in Next.js Server Components, Server Actions, or Route Handlers.
 *
 * ### How it works
 * It retrieves the current request's cookies using the `cookies()` function from
 * `next/headers`. This cookie store is then passed to the `createClient` utility,
 * which initializes a Supabase client capable of reading and writing the user's
 * session information.
 *
 * ### Why it's needed
 * In a server-side context, each request is stateless. This function ensures that for
 * every server-side operation, we create a new Supabase client that is aware of the
 * current user's session. This allows us to enforce Row-Level Security (RLS)
 * policies in our database and perform actions on behalf of the authenticated user,
 * such as fetching their own polls (`fetchPollsByOwner`) or checking their voting
 * status (`fetchPollDetails`).
 *
 * ### Assumptions
 * - This function must be called within a Next.js Server Component, Server Action,
 *   or Route Handler. The `cookies()` function will throw an error if used elsewhere.
 * - The `createClient` utility in `@/lib/supabase/server` is correctly configured to
 *   manage Supabase sessions using the provided cookie store.
 *
 * ### Edge Cases
 * - Calling this function outside of a valid server-side context will result in a runtime error.
 * - If the user's cookies are disabled, tampered with, or expired, the Supabase client
 *   will act as an unauthenticated/anonymous user, which may lead to permission errors
 *   based on RLS policies.
 *
 * ### Connections to other components
 * This is a foundational utility used by almost all other server-side functions in this
 * module (`fetchPollsByOwner`, `fetchPollDetails`, etc.). Any function that requires
 * an authenticated context to interact with the database relies on this to get the
 * necessary client instance.
 *
 * @returns A promise that resolves to an instance of the Supabase client.
 */
export async function getSupabaseClient() {
  const cookieStore = cookies();
  return createClient(cookieStore);
}

// Define the types for the data we expect from our RPC functions.
// This ensures type safety when we call them.

export type PollWithVoteData = Pick<
  Database["public"]["Tables"]["polls"]["Row"],
  "id" | "question" | "description" | "created_at"
> & {
  options: Array<{ id: string; text: string; votes: number }>;
  totalVotes: number;
  hasVoted: boolean;
  isOwner: boolean;
};

export type FetchedPoll = Pick<
  Database["public"]["Tables"]["polls"]["Row"],
  "id" | "question" | "created_at"
> & {
  totalVotes: number;
};

/**
 * Fetches a list of polls created by a specific user, along with the total vote count for each.
 *
 * ### Description
 * This function retrieves a summary of all polls owned by the given `userId`.
 * It's primarily used to display a user's created polls on a dashboard or profile page,
 * allowing them to see their content at a glance.
 *
 * ### How it works
 * It leverages a Supabase Remote Procedure Call (RPC) named `get_polls_with_counts`.
 * First, it obtains an authenticated Supabase client via `getSupabaseClient()`.
 * Then, it calls the RPC, passing the `userId` as a parameter. The database
 * function is responsible for filtering the polls by the owner and calculating
 * the total votes for each.
 *
 * ### Why it's needed
 * In the application, users need a way to view and manage the polls they have personally
 * created. This function provides the specific data needed for such a feature (e.g., a "My Polls"
 * page), separating it from the general list of all polls available to everyone.
 *
 * ### Assumptions
 * - The `userId` provided is a valid UUID corresponding to an existing user.
 * - The `get_polls_with_counts` RPC function is defined in the database and correctly
 *   filters polls by the `p_user_id` parameter.
 * - The request is made within a server-side context where `getSupabaseClient()` can
 *   successfully create an authenticated client. This is important for RLS to apply if needed.
 *
 * ### Edge Cases
 * - If the user has not created any polls, the function will return an empty array.
 * - If the provided `userId` does not exist, the result will also be an empty array.
 * - If the database RPC fails or does not exist, the Supabase client will return an
 *   error object in its response, which must be handled by the calling component.
 *
 * ### Connections to other components
 * - This function is typically called from a server component responsible for rendering a user's
 *   dashboard or profile (e.g., `/dashboard/page.tsx`).
 * - It depends on `getSupabaseClient()` to interact with the database in an authenticated manner.
 * - The list of polls returned by this function is often rendered as a series of links,
 *   where each link navigates to a detailed poll page that would then use `fetchPollDetails`.
 *
 * @param userId - The UUID of the user whose polls are to be fetched.
 * @returns A promise that resolves to the result of the RPC call, which includes
 *          the data (an array of `FetchedPoll` objects) or an error.
 */
export async function fetchPollsByOwner(userId: string) {
  const supabase = await getSupabaseClient();
  return supabase.rpc("get_polls_with_counts", {
    p_user_id: userId,
  });
}

/**
 * Fetches detailed information for a single poll, including its options, vote counts, and the current user's voting status.
 *
 * ### Description
 * This function retrieves all the necessary data to display a single poll page. This includes the poll's question,
 * description, options, the vote count for each option, the total votes, whether the current user owns the poll,
 * and whether they have already cast a vote.
 *
 * ### How it works
 * It calls a Supabase Remote Procedure Call (RPC) named `get_poll_details`. It first obtains an authenticated
 * Supabase client using `getSupabaseClient()`. It then invokes the RPC with the `pollId` and an optional `userId`.
 * The database function is responsible for joining the `polls`, `options`, and `votes` tables to aggregate all
 * the required information into a single response object.
 *
 * ### Why it's needed
 * This function is the backbone of the individual poll viewing page. Instead of making multiple separate
 * database queries (one for the poll, one for options, one for votes, one to check user status), this function
 * encapsulates that logic into a single, efficient database call. This simplifies the server-side logic and
 * improves performance by reducing database round-trips. It provides the front-end component with a complete,
 * ready-to-render data structure.
 *
 * ### Assumptions
 * - The `get_poll_details` RPC function exists in the database and is designed to return the data structure
 *   matching the `PollWithVoteData` type.
 * - The provided `pollId` is a valid UUID corresponding to a poll in the database.
 * - The optional `userId` is the UUID of the currently authenticated user. This is necessary to correctly
 *   determine the `hasVoted` and `isOwner` flags.
 *
 * ### Edge Cases
 * - If the `pollId` does not exist, the RPC will return `null` or an empty array. The calling component
 *   must handle this case, for instance, by displaying a 404 "Not Found" page.
 * - If the `userId` is not provided or is `null`, the `hasVoted` and `isOwner` fields will resolve to `false`,
 *   treating the viewer as an unauthenticated guest.
 * - If there is a database error during the RPC execution, the Supabase client will return an error object
 *   that must be handled by the caller.
 *
 * ### Connections to other components
 * - This function is the primary data source for any component that renders a single poll in detail, most
 *   notably the dynamic route page like `app/polls/[id]/page.tsx`.
 * - The data returned, particularly `hasVoted` and `isOwner`, directly controls the UI state, determining
 *   whether to show voting buttons, the poll results, or administrative controls (like a delete button).
 */
export async function fetchPollDetails(pollId: string, userId?: string) {
  const supabase = await getSupabaseClient();
  return supabase.rpc("get_poll_details", {
    p_poll_id: pollId,
    p_user_id: userId,
  });
}
