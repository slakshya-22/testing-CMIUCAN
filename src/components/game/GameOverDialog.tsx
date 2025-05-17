
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
import { useAuth } from "@/context/AuthContext"; // Import useAuth

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  onPlayAgain: () => void;
  onSaveScore: (name: string) => void;
  gameName?: string;
}

export function GameOverDialog({ 
  isOpen, 
  score, 
  onPlayAgain, 
  onSaveScore, 
  gameName = "Cash Me If You Can" 
}: GameOverDialogProps) {
  const [nameInput, setNameInput] = useState("");
  const router = useRouter();
  const { user } = useAuth(); // Get current user

  const localStorageKey = `${gameName.toLowerCase().replace(/\s+/g, "-")}PlayerName`;

  useEffect(() => {
    if (isOpen) {
      if (user?.displayName) {
        setNameInput(user.displayName);
      } else {
        const savedName = localStorage.getItem(localStorageKey);
        if (savedName) {
          setNameInput(savedName);
        }
      }
    }
  }, [isOpen, user, localStorageKey]);


  const handleSaveScore = () => {
    const nameToSave = nameInput.trim() || user?.displayName || "Anonymous Player";
    if (nameToSave) {
      onSaveScore(nameToSave);
      if (!user?.displayName) { // Only save to local storage if there's no firebase display name
          localStorage.setItem(localStorageKey, nameToSave);
      }
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
            Congratulations{user?.displayName ? `, ${user.displayName}` : ''}! You scored <strong className="text-accent font-bold">{score.toLocaleString()}</strong> points.
            {score > 0 ? " Enter or confirm your name to save your score to the leaderboard." : " Better luck next time!"}
          </DialogDescription>
        </DialogHeader>
        {score > 0 && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-muted-foreground">
                Name
              </Label>
              <Input
                id="name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="col-span-3 bg-input border-border focus:ring-primary text-foreground placeholder:text-muted-foreground/70"
                placeholder="Trivia Champion"
              />
            </div>
          </div>
        )}
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={handlePlayAgain} className="border-primary text-primary hover:bg-primary/10 hover:text-primary">
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          {score > 0 && (
            <Button onClick={handleSaveScore} disabled={!nameInput.trim() && !user?.displayName} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Trophy className="mr-2 h-4 w-4" />
              Save & View Leaderboard
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
