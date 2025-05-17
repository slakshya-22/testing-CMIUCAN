"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PartyPopper, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  onPlayAgain: () => void;
  onSaveScore: (name: string) => void;
}

export function GameOverDialog({ isOpen, score, onPlayAgain, onSaveScore }: GameOverDialogProps) {
  const [name, setName] = useState("");
  const router = useRouter();

  // Effect to read name from localStorage if available
  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem("triviMasterPlayerName");
      if (savedName) {
        setName(savedName);
      }
    }
  }, [isOpen]);


  const handleSaveScore = () => {
    if (name.trim()) {
      onSaveScore(name.trim());
      localStorage.setItem("triviMasterPlayerName", name.trim()); // Save name for next time
      router.push("/leaderboard");
    }
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Controlled externally */ }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <PartyPopper className="mr-2 h-7 w-7 text-yellow-500" />
            Game Over!
          </DialogTitle>
          <DialogDescription>
            Congratulations! You scored <strong className="text-primary">{score}</strong> points.
            Enter your name to save your score to the leaderboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Trivia Champion"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handlePlayAgain} className="mb-2 sm:mb-0">
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          <Button onClick={handleSaveScore} disabled={!name.trim()}>
            Save Score & View Leaderboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
