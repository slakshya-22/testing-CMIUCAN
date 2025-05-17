
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
import { PartyPopper, RotateCcw, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  onPlayAgain: () => void;
  onSaveScore: (name: string) => void;
  gameName?: string;
}

export function GameOverDialog({ isOpen, score, onPlayAgain, onSaveScore, gameName = "Cash Me If You Can" }: GameOverDialogProps) {
  const [name, setName] = useState("");
  const router = useRouter();
  const localStorageKey = `${gameName.toLowerCase().replace(/\s+/g, "-")}PlayerName`;


  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem(localStorageKey);
      if (savedName) {
        setName(savedName);
      }
    }
  }, [isOpen, localStorageKey]);


  const handleSaveScore = () => {
    if (name.trim()) {
      onSaveScore(name.trim());
      localStorage.setItem(localStorageKey, name.trim());
      router.push("/leaderboard");
    }
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Controlled externally */ }}>
      <DialogContent className="sm:max-w-md bg-card/90 backdrop-blur-md border-primary shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl text-primary">
            <PartyPopper className="mr-2 h-7 w-7 text-accent" />
            Game Over!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Congratulations! You scored <strong className="text-accent font-bold">{score.toLocaleString()}</strong> points in {gameName}.
            Enter your name to save your score to the leaderboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-muted-foreground">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 bg-input border-border focus:ring-primary text-foreground placeholder:text-muted-foreground/70"
              placeholder="Trivia Champion"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={handlePlayAgain} className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          <Button onClick={handleSaveScore} disabled={!name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Trophy className="mr-2 h-4 w-4" />
            Save & View Leaderboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
