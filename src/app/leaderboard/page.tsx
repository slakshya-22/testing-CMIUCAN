
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
import { Trophy, ListChecks, Medal } from "lucide-react"; // Medal for rank
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeaderboardPage() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedScores = localStorage.getItem("cashMeIfYouCanHighScores");
    if (storedScores) {
      try {
        const parsedScores = JSON.parse(storedScores) as ScoreEntry[];
        // Sort scores again just in case they weren't stored sorted or got corrupted
        parsedScores.sort((a, b) => b.score - a.score);
        setScores(parsedScores.slice(0,10)); // Ensure only top 10
      } catch (e) {
        console.error("Failed to parse scores from localStorage", e);
        localStorage.removeItem("cashMeIfYouCanHighScores"); // Clear corrupted data
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-12rem)] p-4">
        <ListChecks className="h-12 w-12 sm:h-16 sm:w-16 animate-pulse text-primary" />
        <p className="ml-4 text-lg sm:text-xl text-muted-foreground mt-4">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-2 sm:px-4">
      <Card className="max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto shadow-2xl bg-card/80 backdrop-blur-md border-primary/30 rounded-xl">
        <CardHeader className="text-center p-5 sm:p-6">
          <div className="inline-block mx-auto p-3 sm:p-4 bg-gradient-to-br from-primary via-accent to-secondary rounded-full mb-3 sm:mb-4 shadow-lg">
            <Trophy className="h-12 w-12 sm:h-14 sm:w-14 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl sm:text-4xl font-bold text-primary">High Scores</CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground">
            Champions of "Cash Me If You Can"!
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-4 md:px-6 pb-5 sm:pb-6">
          {scores.length === 0 ? (
            <div className="text-center py-8 sm:py-10">
              <p className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6">
                No scores recorded yet. Be the first to make history!
              </p>
              <div data-ai-hint="empty stage spotlight" className="flex justify-center mb-6">
                <img 
                    src="https://placehold.co/300x200.png" 
                    alt="Empty leaderboard stage" 
                    className="mx-auto rounded-lg shadow-md border border-border max-w-[300px] w-full" 
                />
              </div>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg">
                <Link href="/">Play Now</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption className="text-sm sm:text-base mt-4">Top 10 "Cash Me If You Can" Champions</TableCaption>
              <TableHeader>
                <TableRow className="border-b-primary/30">
                  <TableHead className="w-[60px] sm:w-[80px] text-center text-accent font-semibold text-sm sm:text-base">Rank</TableHead>
                  <TableHead className="text-accent font-semibold text-sm sm:text-base">Name</TableHead>
                  <TableHead className="text-right text-accent font-semibold text-sm sm:text-base">Score</TableHead>
                  <TableHead className="text-right hidden md:table-cell text-accent font-semibold text-sm sm:text-base">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((entry, index) => (
                  <TableRow 
                    key={entry.id || index} 
                    className={cn(
                        "hover:bg-primary/10 border-b-border/50",
                        index === 0 && "bg-accent/10 hover:bg-accent/20", // Highlight #1
                        index === 1 && "bg-primary/15 hover:bg-primary/25", // Highlight #2
                        index === 2 && "bg-secondary/10 hover:bg-secondary/20" // Highlight #3
                    )}
                  >
                    <TableCell className="font-medium text-center text-base sm:text-lg">
                        {index < 3 ? <Medal className={cn("inline-block h-5 w-5 sm:h-6 sm:w-6", index === 0 && "text-yellow-400", index === 1 && "text-slate-400", index === 2 && "text-orange-400")} /> : index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground text-sm sm:text-base">{entry.name}</TableCell>
                    <TableCell className="text-right font-semibold text-primary text-sm sm:text-base">
                      {entry.score.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
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

    