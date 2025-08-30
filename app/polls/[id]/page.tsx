"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// TODO: This is placeholder data. Fetch the specific poll data from Supabase
// using the `params.id`.
const pollData = {
  id: "123",
  question: "Is AI-assisted development the future?",
  options: [
    { id: "opt1", text: "Absolutely!", votes: 15 },
    { id: "opt2", text: "It has potential.", votes: 25 },
    { id: "opt3", text: "Not convinced yet.", votes: 5 },
  ],
};

export default function PollPage({ params }: { params: { id: string } }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const pollUrl = typeof window !== "undefined" ? window.location.href : "";

  const totalVotes = pollData.options.reduce(
    (acc, option) => acc + option.votes,
    0,
  );

  const handleVote = () => {
    if (!selectedOption) return;
    // TODO: Implement Supabase logic to record the vote.
    // 1. Check if the user is logged in (based on your auth flow).
    // 2. Check if the user has already voted on this poll.
    // 3. If not, insert the vote into the 'votes' table.
    // 4. Update the UI to show the results.
    console.log("Voted for:", selectedOption);
    setVoted(true);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{pollData.question}</CardTitle>
            <CardDescription>
              Cast your vote below or view the results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {voted ? (
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
          </CardContent>
          <CardFooter>
            {!voted && (
              <Button onClick={handleVote} disabled={!selectedOption}>
                Submit Vote
              </Button>
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
            {/* We check for `pollUrl` to avoid rendering an empty QR code during SSR */}
            {pollUrl && <QRCodeSVG value={pollUrl} size={160} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
