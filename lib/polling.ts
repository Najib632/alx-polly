"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Database } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation"; // Ensure redirect is imported if not already

// Define a type for the poll data we expect to fetch and display on the dashboard
type FetchedPoll = Pick<
  Database["public"]["Tables"]["polls"]["Row"],
  "id" | "question" | "created_at"
> & {
  totalVotes: number; // Now expecting a number, will be 0 if no votes
};

// Define a type for the poll data including options and their vote counts
// This should align with what the PollPage component expects
type PollWithVoteData = Pick<
  Database["public"]["Tables"]["polls"]["Row"],
  "id" | "question" | "description" | "created_at"
> & {
  options: Array<{ id: string; text: string; votes: number }>;
  totalVotes: number;
};

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
    .eq("owner_id", user.id) // Filter by owner_id explicitly here for clarity
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
    .select("poll_id, vote_count") // Select poll_id and vote_count from the view
    .in("poll_id", pollIds); // Filter for the IDs of polls we just fetched

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

export async function getPollById(
  pollId: string,
): Promise<PollWithVoteData | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Fetch the specific poll and its options.
  // We'll fetch options separately and then fetch their vote counts.
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id, question, description, created_at") // Fetch poll basic details
    .eq("id", pollId)
    .single();

  if (pollError) {
    console.error(`Error fetching poll with ID ${pollId}:`, pollError);
    return null;
  }

  if (!poll) {
    return null; // Poll not found
  }

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
  };

  return formattedPoll;
}

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
