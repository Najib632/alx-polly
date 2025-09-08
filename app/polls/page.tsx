"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import PollCard from "@/components/polls/poll-card";
import { getPolls } from "@/lib/polling";

export default function PollsDashboard() {
  /**
   * Renders the main dashboard for viewing and managing user-created polls.
   *
   * Why this component is needed:
   * This component serves as the central hub for a user's interaction with their
   * polls. It provides a high-level overview of all their created polls and acts
   * as a jumping-off point for creating new ones. By centralizing this view, it
   * improves user experience by giving them a clear and organized way to see
   * their content.
   *
   * @component
   * @returns {JSX.Element} The rendered dashboard UI.
   *
   * @assumptions
   * - This component is a client component, as indicated by `"use client"`.
   * - It is wrapped in a `QueryClientProvider` from `@tanstack/react-query` to
   *   enable the `useQuery` hook.
   * - The `getPolls` function handles user authentication implicitly (e.g., via
   *   cookies or auth tokens) to fetch only the polls belonging to the current user.
   *
   * @edgeCases
   * - **Loading:** Displays a "Loading..." message while polls are being fetched.
   * - **Error:** Displays an error message if the API call to `getPolls` fails.
   * - **Empty State:** If the user has not created any polls, it displays a
   *   call-to-action message instead of an empty grid.
   *
   * @see {@link PollCard} - This is a child component that `PollsDashboard` maps over
   *   the fetched poll data to render. Each `PollCard` is responsible for displaying
   *   the summary of a single poll.
   * @see {@link getPolls} - The server action or API client function used to fetch the
   *   array of polls from the backend.
   */

  // Fetch polls using the useQuery hook
  const {
    data: polls,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["polls"],
    queryFn: getPolls,
  });

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Polls</h1>
        <Button asChild>
          <Link href="/polls/create">Create New Poll</Link>
        </Button>
      </div>

      {/* Handle loading and error states */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading your polls...
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-red-500">
          There was an error fetching your polls. Please try again later.
        </div>
      ) : polls && polls.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          You haven't created any polls yet. Click the button above to create
          your first one!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Map through fetched polls and render PollCard for each */}
          {polls?.map((poll) => (
            // Ensure the poll object passed to PollCard matches its expected props
            <PollCard key={poll.id} poll={poll as any} />
            // Note: The `as any` cast might be needed if PollCard expects
            // slightly different structure than FetchedPoll, e.g., if it
            // expects 'totalVotes' to always be a number and not null.
            // We'll refine this if necessary.
          ))}
        </div>
      )}
    </div>
  );
}
