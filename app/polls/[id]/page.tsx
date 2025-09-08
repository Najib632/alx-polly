"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  getPollById,
  castVote,
  deleteVote,
  updatePollQuestion,
} from "@/lib/polling"; // Import castVote from lib/polling.ts
import { useParams } from "next/navigation";

// Define the structure that getPollById will return
interface PollDisplayData {
  id: string;
  question: string;
  description?: string | null;
  options: { id: string; text: string; votes: number }[];
  totalVotes: number;
  hasVoted: boolean;
  isOwner: boolean;
}

export default function PollPage() {
  /**
   * Renders the dedicated page for a single poll.
   *
   * @purpose This component serves as the primary interface for users to interact with a specific poll.
   * It fetches the poll's data based on the ID from the URL, displays the question and options,
   * and manages all user interactions like voting, viewing results, editing, deleting, and sharing.
   *
   * @context This component is designed to be a dynamic page within a Next.js application,
   * typically corresponding to a route like `/polls/[id]`. It's a "smart" component that handles
   * its own state management and data fetching logic for everything related to a single poll.
   *
   * @assumptions
   * - The component is rendered within a Next.js dynamic route (`/polls/[id]`) where `id` is the poll's unique identifier.
   * - The `useParams` hook from `next/navigation` will successfully provide this `id`.
   * - A suite of API utility functions (`getPollById`, `castVote`, `deleteVote`, `updatePollQuestion`)
   *   are available in `@/lib/polling` to communicate with the backend.
   * - The `PollDisplayData` interface correctly matches the shape of the data returned by `getPollById`.
   * - UI components from `@/components/ui` (e.g., Card, Button, Input) are properly configured and available.
   *
   * @stateManagement
   * - `pollData`: Stores the fetched poll details.
   * - `loading`: Tracks the initial data fetch state.
   * - `error`: Stores any errors that occur during data fetching.
   * - `voted`: A boolean that toggles the view between the voting form and the results display. This is initialized based on the `hasVoted` property from the fetched data.
   * - `selectedOption`: Holds the ID of the option the user has selected before voting.
   * - `isCastingVote`: A loading state specifically for the vote submission process.
   * - `isEditing`: Toggles the view between displaying the poll question and an editing form (for the poll owner).
   *
   * @edgeCases
   * - **Invalid/Missing Poll ID:** If the URL parameter `id` is not a valid poll ID or if the poll doesn't exist, an error message is displayed.
   * - **Network Failure:** If `getPollById` or other API calls fail due to network issues, an error state is triggered.
   * - **UI State:** The "Submit Vote" button is disabled until an option is selected to prevent empty submissions. The button also shows a loading state during the submission process.
   * - **Authorization:** Edit and Delete controls are only rendered if the fetched `pollData.isOwner` flag is true. The backend is the ultimate authority on these actions.
   *
   * @connections
   * - **`@/lib/polling`**: This component is tightly coupled with the polling library functions for all its server interactions.
   * - **`next/navigation`**: Uses `useParams` to get the poll ID from the URL, linking it directly to the routing system.
   * - **UI Library (`@/components/ui`)**: Heavily relies on these shared components for a consistent look and feel.
   * - **`qrcode.react`**: Used to generate a scannable QR code for easy sharing of the poll's URL.
   */
  const params = useParams();
  const pollId = params.id as string;

  const [pollData, setPollData] = useState<PollDisplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voted, setVoted] = useState(false); // State to control showing results or voting form
  const [isCastingVote, setIsCastingVote] = useState(false); // State for vote submission loading
  const [voteMessage, setVoteMessage] = useState<string | null>(null); // State for vote feedback
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  // Function to fetch poll data
  const fetchPoll = async () => {
    if (!pollId) return;

    setLoading(true);
    setError(null);
    setVoteMessage(null); // Clear messages on re-fetch
    try {
      const data = await getPollById(pollId);
      if (data) {
        setPollData(data);
        setVoted(data.hasVoted); // Set voted status from fetched data
        setEditedQuestion(data.question);
        setEditedDescription(data.description || "");
      } else {
        setError("Could not find poll or an error occurred.");
      }
    } catch (e) {
      console.error("Failed to fetch poll:", e);
      setError("Failed to load poll data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch poll data when the component mounts or pollId changes
  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/polls/${pollId}`
      : "";

  const totalVotes =
    pollData?.options.reduce((acc, option) => acc + option.votes, 0) ?? 0;

  const handleVote = async () => {
    if (!selectedOption || isCastingVote) return;

    setIsCastingVote(true);
    setVoteMessage(null);

    const result = await castVote(pollId, selectedOption);

    if (result.success) {
      setVoted(true); // Show results after successful vote
      setVoteMessage(result.message);
      await fetchPoll(); // Re-fetch poll data to update vote counts after casting a vote
    } else {
      setVoteMessage(result.message);
    }
    setIsCastingVote(false);
  };

  const handleDelete = async () => {
    if (!pollData) return;
    const confirmation = window.confirm(
      "Are you sure you want to delete this poll?",
    );
    if (confirmation) {
      await deleteVote(pollData.id);
    }
  };

  const handleUpdate = async () => {
    if (!pollData) return;
    const result = await updatePollQuestion(
      pollData.id,
      editedQuestion,
      editedDescription,
    );
    if (result.success) {
      setIsEditing(false);
      fetchPoll();
    } else {
      // Handle error
      console.error(result.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 md:p-6">Loading poll...</div>;
  }

  if (error || !pollData) {
    return (
      <div className="container mx-auto p-4 md:p-6 text-red-500">
        {error || "Poll not found."}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={editedQuestion}
                  onChange={(e) => setEditedQuestion(e.target.value)}
                />
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                />
              </div>
            ) : (
              <>
                <CardTitle>{pollData.question}</CardTitle>
                {pollData.description && (
                  <CardDescription>{pollData.description}</CardDescription>
                )}
              </>
            )}
          </CardHeader>
          <CardContent>
            {voted || isCastingVote ? ( // Show results if voted or currently casting vote
              <div className="space-y-4">
                <h3 className="font-semibold">Results</h3>
                {pollData.options.map((option) => {
                  const percentage =
                    totalVotes > 0
                      ? Math.round((option.votes / totalVotes) * 100)
                      : 0;
                  return (
                    <div key={option.id} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>{option.text}</span>
                        <span>
                          {option.votes} votes ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <RadioGroup onValueChange={setSelectedOption}>
                <div className="space-y-2">
                  {pollData.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id}>{option.text}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            {voteMessage && (
              <div
                className={`mt-4 rounded-md border p-3 text-sm ${
                  voteMessage.includes("successfully")
                    ? "border-green-500 bg-green-50 text-green-800"
                    : "border-red-500 bg-red-50 text-red-700"
                }`}
              >
                {voteMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {!voted && (
              <Button
                onClick={handleVote}
                disabled={!selectedOption || isCastingVote}
              >
                {isCastingVote ? "Submitting Vote..." : "Submit Vote"}
              </Button>
            )}
            {pollData.isOwner && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleUpdate}>Save</Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Share this Poll</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-6">
            {pollUrl && <QRCodeSVG value={pollUrl} size={160} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
