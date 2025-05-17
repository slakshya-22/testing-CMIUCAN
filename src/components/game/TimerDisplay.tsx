"use client";

import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface TimerDisplayProps {
  timeLeft: number;
  initialTime: number;
}

export function TimerDisplay({ timeLeft, initialTime }: TimerDisplayProps) {
  const progressPercentage = (timeLeft / initialTime) * 100;

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-md flex items-center space-x-4">
      <Clock className="h-8 w-8 text-primary" />
      <div className="flex-grow">
        <div className="text-2xl font-bold text-foreground mb-1">
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
          {String(timeLeft % 60).padStart(2, '0')}
        </div>
        <Progress value={progressPercentage} className="h-3 w-full transition-all duration-300" />
      </div>
    </div>
  );
}
