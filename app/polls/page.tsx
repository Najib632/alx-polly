import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import PollCard from "@/components/polls/poll-card";

// TODO: This is placeholder data. Fetch real poll data from Supabase
// for the currently authenticated user.
const polls = [
  {
    id: "1",
    question: "What should we have for lunch?",
    options: [{ text: "Pizza" }, { text: "Salad" }],
    totalVotes: 15,
  },
  {
    id: "2",
    question: "Favorite programming language?",
    options: [{ text: "TypeScript" }, { text: "Python" }, { text: "Rust" }],
    totalVotes: 42,
  },
];

export default async function PollsDashboard() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Polls</h1>
        <Button asChild>
          <Link href="/polls/create">Create New Poll</Link>
        </Button>
      </div>

      {/* TODO: Add a message or illustration for when the user has no polls. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {polls.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>
    </div>
  );
}
