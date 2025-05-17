"use client";

import { Award, Star } from "lucide-react"; // Using Star for KBC-like feel

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="p-4 bg-card rounded-lg shadow-xl border border-primary/20 flex flex-col items-center space-y-2">
      <div className="flex items-center text-primary">
        <Star className="h-7 w-7 mr-2 fill-primary" />
        <p className="text-lg font-medium">Current Score</p>
      </div>
      <p className="text-5xl font-bold text-accent animate-pulse">{score}</p>
    </div>
  );
}
