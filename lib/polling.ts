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
 * @description
 * Fetches a summary list of all polls created by the currently authenticated user.
 * This function is essential for the "My Polls" or user dashboard feature, where
 * users can see an overview of the polls they have created and their current
 * vote counts.
 *
 * @context & Usage
 * This server action is designed to be called from a server-side component.
 * The component will await the result of this function and then map over the
 * returned array to display a list of polls. This separation of concerns keeps
 * data fetching logic on the server, close to the database.
 *
 * @assumptions
 * - This function executes in a server environment where it can access cookies
 *   to create a Supabase server client.
 * - A user session is expected to be present for any data to be returned.
 *
 * @edgeCases & Error Handling
 * - **Unauthenticated User**: If no user is logged in (or the session is invalid),
 *   the function returns an empty array `[]`. The UI must handle this state,
 *   perhaps by showing a "You haven't created any polls" message or a login prompt.
 * - **Database Errors**: If the underlying `fetchPollsByOwner` query fails, the
 *   error is logged to the server console, and an empty array is returned. This
 *   ensures the application remains stable and doesn't crash the page.
 *
 * @dependencies & Related Components
 * - **UI Components**: The primary consumer of this function is a page component
 *   (e.g., `/app/polls/page.tsx`) that renders the list of polls.
 * - **`fetchPollsByOwner`**: This function abstracts the direct database query,
 *   promoting code reuse and maintainability.
 * - **`deleteVote` Action**: When a user deletes a poll, the `deleteVote` function
 *   calls `revalidatePath("/polls")`, which triggers a re-execution of this
 *   `getPolls` function on the next page view to ensure the list is up-to-date.
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
 * @description
 * Fetches the complete details for a single poll, including its question,
 * description, options, vote counts for each option, and the current user's
 * voting status (if they are logged in).
 *
 * @context & Usage
 * This server action is the data source for the individual poll detail page
 * (e.g., `/polls/[id]`). It provides all the necessary information to render
 * the poll, display the results, and determine whether the current user has
 * already voted. A server component for a specific poll would `await` this
 * function to get the data before rendering.
 *
 * @assumptions
 * - This function is executed in a server environment where it can access cookies
 *   to create a Supabase client.
 * - The `pollId` parameter is expected to be a valid UUID corresponding to a poll.
 * - The function is designed to work for both authenticated and unauthenticated
 *   users. If a user is logged in, their ID is passed to the underlying query
 *   to fetch their specific voting data. If not, this data is simply omitted.
 *
 * @edgeCases & Error Handling
 * - **Poll Not Found**: If no poll exists for the given `pollId`, the function
 *   gracefully returns `null`. The calling UI component must handle this case,
 *   typically by rendering a 404 "Not Found" page.
 * - **Database Errors**: If the underlying `fetchPollDetails` query fails, the
 *   error is logged to the server console, and `null` is returned. This ensures
 *   the application doesn't crash and can display a generic error message.
 *
 * @dependencies & Related Components
 * - **UI Components**: The primary consumer is the dynamic page component
 *   responsible for displaying a single poll (e.g., `/app/polls/[id]/page.tsx`).
 * - **`fetchPollDetails`**: This function relies on a lower-level query function
 *   to abstract the complex SQL logic required to join polls, options, and votes.
 * - **`castVote` Action**: After a user votes, the `castVote` action calls
 *   `revalidatePath(`/polls/${pollId}`), which triggers a refetch of this data,
 *   ensuring the UI is updated with the new vote counts immediately.
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
 * @description
 * Deletes an entire poll based on its ID. (Note: The function is named `deleteVote`
 * but its implementation deletes a poll). This is a critical administrative action
 * for poll creators, allowing them to permanently remove polls they no longer need.
 * The deletion cascades through the database, removing associated options and votes as well.
 *
 * @context & Usage
 * This server action is intended to be called from a UI element, such as a "Delete Poll"
 * button, available only to the owner of the poll on their dashboard (`/polls`) or on the
 * specific poll's detail page. It provides essential content management functionality for users.
 *
 * @assumptions
 * - This function runs in a server environment with access to cookies for Supabase client creation.
 * - **Crucially, this function relies on Supabase Row Level Security (RLS).** An RLS policy
 *   must be configured on the `polls` table to ensure that a user can only delete a poll
 *   if their authenticated user ID matches the poll's `owner_id`. Without this, any
 *   authenticated user could delete any poll.
 * - The database is configured with cascading deletes, so that when a poll is deleted, all
 *   related records in the `options` and `votes` tables are also automatically removed.
 *
 * @edgeCases & Error Handling
 * - **Authorization Failure**: If a non-owner attempts to delete a poll, the RLS policy
 *   will block the request. The Supabase client may not throw an error but will delete 0 rows,
 *   and this function will still incorrectly return a success message. The UI should be the
 *   primary guard against this by only showing the delete option to the poll's owner.
 * - **Poll Not Found**: If a `pollId` is provided for a poll that doesn't exist, the query
 *   will execute successfully but affect zero rows, returning a success message.
 * - **Database Errors**: Any direct database or network errors during the delete operation
 *   are caught, logged to the server console, and a user-friendly failure message is returned.
 *
 * @dependencies & Related Components
 * - **UI Components**: The primary consumer is a user-facing component that lists polls
 *   (e.g., a component for the `/polls` page) and provides a delete button.
 * - **`revalidatePath`**: After a successful deletion, `revalidatePath("/polls")` is called.
 *   This is vital for ensuring a good user experience, as it purges the server-side cache
 *   for the polls list page. This forces a refetch of data via the `getPolls` action on the
 *   next visit, so the deleted poll no longer appears in the list.
 *
 * @param {string} pollId - The ID of the poll to be deleted.
 * @returns {Promise<{ success: boolean; message: string }>} An object indicating the success
 * or failure of the operation, with a corresponding message.
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
 * @description
 * Updates the question and optional description for a specific poll. This function
 * allows poll creators to correct typos or clarify the text of their polls after
 * creation, providing essential content management capabilities.
 *
 * @context & Usage
 * This server action is designed to be invoked from a client-side form or modal
 * where a user can edit the details of a poll they own. For example, on the
 * `/polls/[id]` page, an "Edit" button could reveal a form that, upon submission,
 * calls this action with the updated text.
 *
 * @assumptions
 * - This function executes in a server environment where it can access cookies
 *   to create a Supabase server client.
 * - **Crucially, it relies on Supabase Row Level Security (RLS).** An RLS policy
 *   must be configured on the `polls` table to ensure that a user can only update
 *   a poll if their authenticated user ID matches the poll's `owner_id`. Without this,
 *   any authenticated user could modify any poll.
 * - The `pollId` provided is a valid UUID corresponding to an existing poll.
 *
 * @edgeCases & Error Handling
 * - **Authorization Failure**: If a user who is not the owner attempts to update
 *   the poll, the RLS policy will prevent the update. The Supabase client might not
 *   return an error in this case but will update 0 rows. The function would still
 *   return a success message. Therefore, the UI should be the primary guard, only
 *   showing the edit functionality to the poll's owner.
 * - **Poll Not Found**: If a `pollId` for a non-existent poll is used, the query
 *   will execute without error but affect zero rows, leading to a success message.
 * - **Database Errors**: Any direct database or network errors during the update
 *   operation are caught, logged to the server console, and a user-friendly
 *   failure message is returned.
 *
 * @dependencies & Related Components
 * - **UI Components**: The primary consumer is an "Edit Poll" form, likely on the
 *   poll detail page (`/app/polls/[id]/page.tsx`) or the user's poll list.
 * - **`revalidatePath`**: After a successful update, `revalidatePath` is called for
 *   both `/polls/${pollId}` and `/polls`. This is critical for immediate UI feedback. It
 *   purges the cache for the poll detail page (to show the new question) and the
 *   main polls list (in case the question is displayed there), forcing a data refetch.
 *
 * @param {string} pollId - The ID of the poll to update.
 * @param {string} newQuestion - The new text for the poll's question.
 * @param {string | null} [newDescription] - The new optional description for the poll.
 * @returns {Promise<{ success: boolean; message: string }>} An object indicating the
 * success or failure of the update operation, with a corresponding message.
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
