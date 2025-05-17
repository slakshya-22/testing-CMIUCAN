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
import { Trophy, ListChecks, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Updated localStorage key
    const storedScores = localStorage.getItem("cashMeIfYouCanHighScores");
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
      <Card className="max-w-2xl mx-auto shadow-2xl bg-card/80 backdrop-blur-sm border-primary/30">
        <CardHeader className="text-center">
          <div className="inline-block mx-auto p-4 bg-gradient-to-br from-primary via-accent to-secondary rounded-full mb-4 shadow-lg">
            <Trophy className="h-14 w-14 text-primary-foreground" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary">High Scores</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Champions of "Cash Me If You Can"!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl text-muted-foreground mb-4">
                No scores recorded yet. Be the first to make history!
              </p>
              <div data-ai-hint="empty stage spotlight">
                <img src="https://placehold.co/300x200.png" alt="Empty leaderboard" className="mx-auto rounded-lg shadow-md border border-border" />
              </div>
              <Button asChild className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/">Play Now</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>Top 10 "Cash Me If You Can" Champions</TableCaption>
              <TableHeader>
                <TableRow className="border-b-primary/30">
                  <TableHead className="w-[50px] text-center text-accent">Rank</TableHead>
                  <TableHead className="text-accent">Name</TableHead>
                  <TableHead className="text-right text-accent">Score</TableHead>
                  <TableHead className="text-right hidden sm:table-cell text-accent">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((entry, index) => (
                  <TableRow key={entry.id} className="hover:bg-primary/10 border-b-border/50">
                    <TableCell className="font-medium text-center text-primary">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{entry.name}</TableCell>
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
