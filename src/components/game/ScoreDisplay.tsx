"use client";

import { Award } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="p-4 bg-card rounded-lg shadow-md flex items-center space-x-3">
      <Award className="h-8 w-8 text-accent" />
      <div>
        <p className="text-sm text-muted-foreground">Score</p>
        <p className="text-3xl font-bold text-foreground">{score}</p>
      </div>
    </div>
  );
}
