"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Database } from "@/lib/types";

/**
 * Creates and returns a Supabase client instance for server-side operations.
 * This function centralizes the client creation logic, making it easier to manage
 * and mock in tests.
 *
 * @returns A Supabase client instance.
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
 * Fetches all polls created by a specific user, including their total vote counts.
 * This function calls the `get_polls_with_counts` RPC in the database.
 *
 * @param userId - The ID of the user whose polls are to be fetched.
 * @returns A promise that resolves to the result of the RPC call.
 */
export async function fetchPollsByOwner(userId: string) {
  const supabase = await getSupabaseClient();
  return supabase.rpc("get_polls_with_counts", {
    p_user_id: userId,
  });
}

/**
 * Fetches the detailed data for a specific poll, including options, vote counts,
 * and user-specific status (hasVoted, isOwner).
 * This function calls the `get_poll_details` RPC in the database.
 *
 * @param pollId - The ID of the poll to fetch.
 * @param userId - The optional ID of the current user.
 * @returns A promise that resolves to the result of the RPC call.
 */
export async function fetchPollDetails(pollId: string, userId?: string) {
  const supabase = await getSupabaseClient();
  return supabase.rpc("get_poll_details", {
    p_poll_id: pollId,
    p_user_id: userId,
  });
}
