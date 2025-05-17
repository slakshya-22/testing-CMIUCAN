"use client";

import { useEffect, useState } from "react";
import type { ScoreEntry } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ListChecks } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedScores = localStorage.getItem("triviMasterHighScores");
    if (storedScores) {
      setScores(JSON.parse(storedScores) as ScoreEntry[]);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <ListChecks className="h-12 w-12 animate-pulse text-primary" />
        <p className="ml-4 text-xl text-muted-foreground">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-block mx-auto p-3 bg-accent/10 rounded-full mb-4">
            <Trophy className="h-12 w-12 text-accent" />
          </div>
          <CardTitle className="text-4xl font-bold">High Scores</CardTitle>
          <CardDescription className="text-lg">
            See who reigns supreme in TriviMaster!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground mb-4">
                No scores recorded yet. Be the first!
              </p>
              <div data-ai-hint="empty state leaderboard">
                <img src="https://placehold.co/300x200.png" alt="Empty leaderboard" className="mx-auto rounded-lg shadow-md" />
              </div>
              <Button asChild className="mt-6">
                <Link href="/">Play Now</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>Top 10 TriviMaster Champions</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((entry, index) => (
                  <TableRow key={entry.id} className="hover:bg-primary/5">
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {entry.score}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-muted-foreground">
                      {entry.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
