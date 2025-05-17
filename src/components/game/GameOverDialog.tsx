
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
import { PartyPopper, RotateCcw, Trophy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  onPlayAgain: () => void;
  onSaveScore: (name: string, userId: string) => Promise<void>; // Modified to take userId and be async
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
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // No need for localStorageKey for player name anymore if using Firebase display name.

  useEffect(() => {
    if (isOpen) {
      if (user?.displayName) {
        setNameInput(user.displayName);
      } else {
        // Fallback if display name is not set, user might need to input
        setNameInput(""); 
      }
      setIsSaving(false); // Reset saving state when dialog opens
    }
  }, [isOpen, user]);


  const handleSaveScore = async () => {
    if (!user) {
      // This case should ideally not be reached if game is protected
      console.error("User not authenticated, cannot save score.");
      return;
    }
    const nameToSave = nameInput.trim() || user.displayName || "Anonymous Player";
    if (nameToSave) {
      setIsSaving(true);
      await onSaveScore(nameToSave, user.uid);
      setIsSaving(false);
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
                disabled={isSaving}
              />
            </div>
          </div>
        )}
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={handlePlayAgain} className="border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled={isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          {score > 0 && (
            <Button onClick={handleSaveScore} disabled={(!nameInput.trim() && !user?.displayName) || isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
              {isSaving ? "Saving..." : "Save & View Leaderboard"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
