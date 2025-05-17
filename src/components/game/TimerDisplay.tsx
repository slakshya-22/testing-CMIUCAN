"use client";

import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface TimerDisplayProps {
  timeLeft: number;
  initialTime: number;
}

export function TimerDisplay({ timeLeft, initialTime }: TimerDisplayProps) {
  const progressPercentage = (timeLeft / initialTime) * 100;
  const isLowTime = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="w-full p-4 bg-card rounded-lg shadow-xl border border-primary/20 flex items-center space-x-4">
      <Clock className={`h-8 w-8 ${isLowTime ? "text-destructive animate-ping" : "text-primary"}`} />
      <div className="flex-grow">
        <div className={`text-3xl font-bold mb-1 text-center ${isLowTime ? "text-destructive" : "text-foreground"}`}>
          {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
          {String(timeLeft % 60).padStart(2, '0')}
        </div>
        <Progress 
          value={progressPercentage} 
          className={`h-3.5 w-full transition-all duration-300 rounded-full ${isLowTime ? '[&>div]:bg-destructive': '[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent'}`} 
        />
      </div>
    </div>
  );
}
