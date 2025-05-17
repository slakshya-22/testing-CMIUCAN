
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
// Input and Label removed as name input is removed
import { PartyPopper, RotateCcw, Trophy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface GameOverDialogProps {
  isOpen: boolean;
  score: number;
  timeTakenMs: number | null; // Added timeTakenMs
  onPlayAgain: () => void;
  onSaveScore: (name: string, userId: string) => Promise<void>;
  gameName?: string;
}

export function GameOverDialog({ 
  isOpen, 
  score, 
  timeTakenMs, // Added timeTakenMs
  onPlayAgain, 
  onSaveScore, 
  gameName = "Cash Me If You Can" 
}: GameOverDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false); // Reset saving state when dialog opens
    }
  }, [isOpen]);

  const formatTime = (ms: number | null) => {
    if (ms === null || ms === 0) return "N/A";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSaveScore = async () => {
    if (!user) {
      console.error("User not authenticated, cannot save score.");
      toast({ title: "Authentication Error", description: "You must be signed in to save your score.", variant: "destructive"});
      return;
    }
    // Use Firebase display name or a fallback
    const nameToSave = user.displayName || user.email?.split('@')[0] || "Anonymous Player";
    
    setIsSaving(true);
    try {
      await onSaveScore(nameToSave, user.uid);
      // Navigation to leaderboard is now handled after save in useGameState or can be triggered here
      router.push("/leaderboard");
    } catch (error) {
      console.error("Error in onSaveScore callback or navigation:", error);
      // Toast for this specific error is likely handled by onSaveScore itself
    } finally {
      setIsSaving(false);
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
            {timeTakenMs !== null && ` Time: ${formatTime(timeTakenMs)}.`}
            {score > 0 ? " Your score will be submitted to the leaderboard." : " Better luck next time!"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Name input removed */}

        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
          <Button variant="outline" onClick={handlePlayAgain} className="border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled={isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          {score > 0 && user && ( // Ensure user is available to save score
            <Button onClick={handleSaveScore} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trophy className="mr-2 h-4 w-4" />}
              {isSaving ? "Saving..." : "Submit & View Leaderboard"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
