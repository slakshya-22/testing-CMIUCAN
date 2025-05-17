
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
import { PartyPopper, RotateCcw, Trophy, Loader2, Sparkles, Crown, Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast"; // Added useToast
import { cn } from "@/lib/utils";

interface GameOverDialogProps {
  isOpen: boolean;
  isWinner: boolean; // New prop
  score: number;
  timeTakenMs: number | null;
  onPlayAgain: () => void;
  onSaveScore: (name: string, userId: string) => Promise<void>;
  gameName?: string;
}

export function GameOverDialog({ 
  isOpen, 
  isWinner,
  score, 
  timeTakenMs,
  onPlayAgain, 
  onSaveScore, 
  gameName = "Cash Me If You Can" 
}: GameOverDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast(); // Initialized useToast

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  const formatTime = (ms: number | null) => {
    if (ms === null || ms === 0) return "N/A";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSaveScoreAndNavigate = async () => {
    if (!user) {
      console.error("User not authenticated, cannot save score.");
      toast({ title: "Authentication Error", description: "You must be signed in to save your score.", variant: "destructive"});
      return;
    }
    const nameToSave = user.displayName || user.email?.split('@')[0] || "Anonymous Player";
    
    setIsSaving(true);
    try {
      await onSaveScore(nameToSave, user.uid);
      // Navigation to leaderboard is now handled here after save
      router.push("/leaderboard");
    } catch (error: any) { // Catch specific error from onSaveScore
      console.error("Error during onSaveScore or navigation:", error);
      toast({
        title: "Failed to Save Score",
        description: error.message || "An unexpected error occurred while trying to save your score.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayAgain = () => {
    onPlayAgain();
  };

  const titleText = isWinner ? "YOU'RE A TRIVIA CHAMPION!" : "Game Over!";
  const descriptionText = isWinner 
    ? `Incredible! You've conquered all questions in ${gameName}! Your final score is an amazing ${score.toLocaleString()} points. Time: ${formatTime(timeTakenMs)}.`
    : `Congratulations${user?.displayName ? `, ${user.displayName}` : ''}! You scored ${score.toLocaleString()} points. Time: ${formatTime(timeTakenMs)}. ${score > 0 ? "Your score will be submitted to the leaderboard." : "Better luck next time!"}`;

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Controlled externally by gameStatus */ }}>
      <DialogContent className={cn(
        "sm:max-w-md bg-card/90 backdrop-blur-md border-primary shadow-2xl",
        isWinner && "border-accent shadow-accent/50 bg-gradient-to-br from-accent/20 via-primary/10 to-secondary/20"
      )}>
        <DialogHeader className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            {isWinner ? (
              <>
                <Crown className="h-10 w-10 text-yellow-400 animate-bounce" style={{animationDelay: '0.1s'}}/>
                <Trophy className="h-12 w-12 text-yellow-500 animate-pulse" />
                <PartyPopper className="h-10 w-10 text-pink-500 animate-bounce" style={{animationDelay: '0.2s'}}/>
              </>
            ) : (
              <Gift className="h-10 w-10 text-accent" />
            )}
          </div>
          <DialogTitle className={cn(
            "text-2xl sm:text-3xl font-bold",
            isWinner ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600" : "text-primary"
          )}>
            {titleText}
          </DialogTitle>
          <DialogDescription className={cn(
            "text-sm sm:text-base",
            isWinner ? "text-foreground" : "text-muted-foreground"
          )}>
            {descriptionText}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="sm:justify-between space-y-2 sm:space-y-0 sm:space-x-2 pt-6">
          <Button variant="outline" onClick={handlePlayAgain} className="border-primary text-primary hover:bg-primary/10 hover:text-primary" disabled={isSaving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Play Again
          </Button>
          {(score > 0 || isWinner) && user && (
            <Button 
              onClick={handleSaveScoreAndNavigate} 
              disabled={isSaving} 
              className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground",
                isWinner && "bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white"
              )}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isWinner ? <Crown className="mr-2 h-4 w-4"/> : <Trophy className="mr-2 h-4 w-4" />)}
              {isSaving ? "Saving..." : (isWinner ? "Claim Victory & See Ranks!" : "Submit & View Leaderboard")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
