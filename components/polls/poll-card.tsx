"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

// TODO: Define a proper type for the poll object based on the database schema.
type PollCardProps = {
  poll: {
    id: string;
    question: string;
    totalVotes: number;
  };
};

export default function PollCard({ poll }: PollCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{poll.question}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{poll.totalVotes} votes</p>
      </CardContent>
      <CardFooter>
        <Link
          href={`/polls/${poll.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View Poll &rarr;
        </Link>
      </CardFooter>
    </Card>
  );
}
