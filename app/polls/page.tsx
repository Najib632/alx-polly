import Link from "next/link";
import { Button } from "@/components/ui/button";
import PollCard from "@/components/polls/poll-card";
import { getPolls } from "@/lib/polling"; // Import the new server action

export default async function PollsDashboard() {
  // Fetch polls using the server action
  const polls = await getPolls();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Polls</h1>
        <Button asChild>
          <Link href="/polls/create">Create New Poll</Link>
        </Button>
      </div>

      {/* Display a message if there are no polls */}
      {polls.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          You haven't created any polls yet. Click the button above to create
          your first one!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Map through fetched polls and render PollCard for each */}
          {polls.map((poll) => (
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
