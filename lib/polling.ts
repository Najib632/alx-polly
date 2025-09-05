"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  fetchPollDetails,
  fetchPollsByOwner,
  FetchedPoll,
  PollWithVoteData,
} from "@/lib/supabase/queries";

/**
 * Fetches all polls created by the currently authenticated user, along with their total vote counts.
 *
 * - Retrieves the current user from Supabase authentication.
 * - If no user is found or an error occurs, returns an empty array.
 * - Selects all polls from the "polls" table where the owner_id matches the user's ID,
 *   ordered by creation date (most recent first).
 * - For each poll, fetches the total number of votes by aggregating vote counts from the "poll_option_counts" view.
 * - Returns an array of polls, each including its id, question, created_at, and totalVotes.
 *
 * @returns {Promise<FetchedPoll[]>} Array of polls with their total vote counts.
 */
export async function getPolls(): Promise<FetchedPoll[]> {
  const supabase = createClient(cookies());
  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError || !user) {
    if (getUserError) {
      console.error("Error fetching user:", getUserError);
    }
    return [];
  }

  const { data: polls, error } = await fetchPollsByOwner(user.id);

  if (error) {
    console.error("Error fetching polls with counts:", error);
    return [];
  }

  return polls || [];
}

/**
 * Fetches a specific poll by its ID, including its options, vote counts, and user context.
 *
 * - Retrieves the current user from Supabase authentication.
 * - Fetches the poll from the "polls" table, including its question, description, creation date, and owner ID.
 * - Determines if the current user has already voted on this poll.
 * - Checks if the current user is the owner of the poll.
 * - Fetches all options for the poll from the "poll_options" table, ordered by their index.
 * - For each option, fetches its vote count from the "poll_option_counts" view.
 * - Returns a PollWithVoteData object containing:
 *   - poll id, question, description, created_at
 *   - options (each with id, text, votes)
 *   - totalVotes (sum of all option votes)
 *   - hasVoted (whether the user has voted)
 *   - isOwner (whether the user is the poll owner)
 * - Returns null if the poll is not found or if there is an error fetching poll/options.
 *
 * @param {string} pollId - The ID of the poll to fetch.
 * @returns {Promise<PollWithVoteData | null>} The poll data with options and vote counts, or null if not found.
 */
export async function getPollById(
  pollId: string,
): Promise<PollWithVoteData | null> {
  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pollDetails, error } = await fetchPollDetails(pollId, user?.id);

  if (error) {
    console.error(`Error fetching details for poll with ID ${pollId}:`, error);
    return null;
  }

  if (!pollDetails || !pollDetails.id) {
    return null; // Poll not found
  }

  return pollDetails;
}

/**
 * Casts a vote for a specific option in a poll.
 *
 * - Retrieves the current user from Supabase authentication.
 * - Calls the "cast_vote" Postgres function (RPC) to record the vote for the given poll and option.
 * - Handles any errors that occur during the voting process and returns a success or failure message.
 * - Revalidates the cache for the poll detail page and the polls list to ensure UI updates.
 *
 * @param {string} pollId - The ID of the poll to vote in.
 * @param {string} optionId - The ID of the option to vote for.
 * @returns {Promise<{ success: boolean; message: string }>} Result of the vote operation.
 */
export async function castVote(
  pollId: string,
  optionId: string,
): Promise<{ success: boolean; message: string }> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: userData, error: userError } = await supabase.auth.getUser();

  const { error } = await supabase.rpc("cast_vote", {
    p_poll_id: pollId,
    p_option_id: optionId,
  });

  if (error) {
    console.error(
      `Error casting vote for poll ${pollId}, option ${optionId}:`,
      error,
    );
    return { success: false, message: error.message || "Failed to cast vote." };
  }

  revalidatePath(`/polls/${pollId}`);
  revalidatePath("/polls");
  return { success: true, message: "Vote cast successfully!" };
}

/**
 * Deletes a poll by its ID.
 *
 * - Retrieves the current user session from Supabase authentication.
 * - Deletes the poll from the "polls" table where the poll's ID matches the provided pollId.
 * - Handles any errors that occur during the deletion process and returns a success or failure message.
 * - Revalidates the cache for the polls list to ensure UI updates.
 * - Redirects the user to the polls list page after deletion.
 *
 * @param {string} pollId - The ID of the poll to delete.
 * @returns {Promise<{ success: boolean; message: string } | void>} Result of the delete operation, or redirects on success.
 */
export async function deleteVote(
  pollId: string,
): Promise<{ success: boolean; message: string }> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.from("polls").delete().match({ id: pollId });

  if (error) {
    console.error(`Error deleting poll with ID ${pollId}:`, error);
    return {
      success: false,
      message: error.message || "Failed to delete poll.",
    };
  }

  revalidatePath("/polls");
  return { success: true, message: "Poll deleted successfully." };
}

/**
 * Updates the question and (optionally) the description of a poll.
 *
 * - Retrieves the current user session from Supabase authentication.
 * - Updates the "polls" table for the poll with the given pollId, setting the new question and description.
 * - Handles any errors that occur during the update process and returns a success or failure message.
 * - Revalidates the cache for the poll detail page and the polls list to ensure UI updates.
 *
 * @param {string} pollId - The ID of the poll to update.
 * @param {string} newQuestion - The new question text for the poll.
 * @param {string | null} [newDescription] - The new description for the poll (optional).
 * @returns {Promise<{ success: boolean; message: string }>} Result of the update operation.
 */
export async function updatePollQuestion(
  pollId: string,
  newQuestion: string,
  newDescription?: string | null,
): Promise<{ success: boolean; message: string }> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase
    .from("polls")
    .update({ question: newQuestion, description: newDescription })
    .eq("id", pollId);

  if (error) {
    console.error(`Error updating poll with ID ${pollId}:`, error);
    return {
      success: false,
      message: error.message || "Failed to update poll.",
    };
  }

  revalidatePath(`/polls/${pollId}`);
  revalidatePath("/polls");

  return { success: true, message: "Poll updated successfully." };
}
