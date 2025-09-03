"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Database } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Define a type for the poll data we expect to fetch and display on the dashboard
type FetchedPoll = Pick<
  Database["public"]["Tables"]["polls"]["Row"],
  "id" | "question" | "created_at"
> & {
  totalVotes: number;
};

// Define a type for the poll data including options and their vote counts
type PollWithVoteData = Pick<
  Database["public"]["Tables"]["polls"]["Row"],
  "id" | "question" | "description" | "created_at"
> & {
  options: Array<{ id: string; text: string; votes: number }>;
  totalVotes: number;
  hasVoted: boolean;
  isOwner: boolean;
};

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
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError) {
    console.error("Error fetching user:", getUserError);
    return [];
  }

  if (!user) {
    return [];
  }

  const { data: pollsDataRaw, error: pollsError } = await supabase
    .from("polls")
    .select("id, question, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (pollsError) {
    console.error("Error fetching polls:", pollsError);
    return [];
  }

  const pollsData = (pollsDataRaw ?? []) as Array<
    Pick<
      Database["public"]["Tables"]["polls"]["Row"],
      "id" | "question" | "created_at"
    >
  >;

  if (pollsData.length === 0) {
    return [];
  }

  const pollIds = pollsData.map((poll) => poll.id);

  // Fetch vote counts for all the retrieved polls efficiently
  // This query fetches aggregated vote counts per poll_id from the view.
  const { data: voteCountsRaw, error: voteCountsError } = await supabase
    .from("poll_option_counts")
    .select("poll_id, vote_count")
    .in("poll_id", pollIds);

  if (voteCountsError) {
    console.error("Error fetching vote counts:", voteCountsError);
    return pollsData.map((poll) => ({
      ...poll,
      totalVotes: 0,
    }));
  }

  const voteCountsMap = new Map<string, number>();
  (voteCountsRaw || []).forEach(({ poll_id, vote_count }) => {
    if (poll_id && vote_count !== null) {
      const currentVotes = voteCountsMap.get(poll_id) || 0;
      voteCountsMap.set(poll_id, currentVotes + vote_count);
    }
  });

  const formattedPolls: FetchedPoll[] = pollsData.map((poll) => ({
    ...poll,
    totalVotes: voteCountsMap.get(poll.id) ?? 0,
  }));

  return formattedPolls;
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
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the specific poll and its options.
  // We'll fetch options separately and then fetch their vote counts.
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, question, description, created_at, owner_id") // Fetch owner_id
    .eq("id", pollId)
    .single();

  if (pollError) {
    console.error(`Error fetching poll with ID ${pollId}:`, pollError);
    return null;
  }

  if (!poll) {
    return null; // Poll not found
  }

  let hasVoted = false;
  if (user) {
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("voter_uid", user.id)
      .maybeSingle();

    if (voteError) {
      console.error(
        `Error checking for existing vote on poll ${pollId}:`,
        voteError,
      );
    }
    if (vote) {
      hasVoted = true;
    }
  }

  const isOwner = user ? user.id === poll.owner_id : false;

  // Fetch options for this specific poll
  const { data: optionsData, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, label, poll_id") // Select option id and label
    .eq("poll_id", pollId)
    .order("idx", { ascending: true }); // Order by index

  if (optionsError) {
    console.error(`Error fetching options for poll ${pollId}:`, optionsError);
    return null;
  }

  if (!optionsData) {
    // If no options found, return poll with empty options
    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      created_at: poll.created_at,
      options: [],
      totalVotes: 0,
      hasVoted,
      isOwner,
    };
  }

  // Fetch vote counts for all options of this poll
  const optionIds = optionsData.map((option) => option.id);
  const { data: voteCountsRaw, error: voteCountsError } = await supabase
    .from("poll_option_counts")
    .select("option_id, vote_count") // Select option_id and vote_count from the view
    .in("option_id", optionIds); // Filter for the options of this specific poll

  if (voteCountsError) {
    console.error(
      `Error fetching vote counts for poll ${pollId}:`,
      voteCountsError,
    );
    // If counts fail, return options with 0 votes
    return {
      id: poll.id,
      question: poll.question,
      description: poll.description,
      created_at: poll.created_at,
      options: (optionsData || []).map((option) => ({
        id: option.id,
        text: option.label,
        votes: 0, // Default to 0 votes if count fetching fails
      })),
      totalVotes: 0,
      hasVoted,
      isOwner,
    };
  }

  const voteCountsData = (voteCountsRaw || []) as Array<{
    option_id: string;
    vote_count: number | null;
  }>;

  const voteCountsMap = new Map<string, number>();
  voteCountsData.forEach(({ option_id, vote_count }) => {
    if (option_id && vote_count !== null) {
      voteCountsMap.set(option_id, vote_count);
    }
  });

  // Combine poll data, options, and their vote counts
  const formattedPoll: PollWithVoteData = {
    id: poll.id,
    question: poll.question,
    description: poll.description,
    created_at: poll.created_at,
    options: (optionsData || []).map((option) => ({
      id: option.id,
      text: option.label,
      votes: voteCountsMap.get(option.id) || 0, // Get votes from map, default to 0
    })),
    totalVotes: (optionsData || []).reduce(
      (sum, option) => sum + (voteCountsMap.get(option.id) || 0),
      0,
    ),
    hasVoted,
    isOwner,
  };

  return formattedPoll;
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
export async function castVote(pollId: string, optionId: string) {
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
