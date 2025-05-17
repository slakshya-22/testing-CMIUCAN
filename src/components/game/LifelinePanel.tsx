"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { PhoneAFriendDialog } from "./PhoneAFriendDialog";
import type { Question } from "@/lib/types";

interface LifelinePanelProps {
  currentQuestion: Question | null;
  isPhoneAFriendUsed: boolean;
  onPhoneAFriendUsed: () => void;
  disabled: boolean;
}

export function LifelinePanel({ currentQuestion, isPhoneAFriendUsed, onPhoneAFriendUsed, disabled }: LifelinePanelProps) {
  const [isPhoneAFriendDialogOpen, setIsPhoneAFriendDialogOpen] = useState(false);

  const handlePhoneAFriendClick = () => {
    if (!isPhoneAFriendUsed) {
      setIsPhoneAFriendDialogOpen(true);
      onPhoneAFriendUsed();
    }
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3 text-foreground">Lifelines</h3>
      <Button
        onClick={handlePhoneAFriendClick}
        disabled={isPhoneAFriendUsed || disabled || !currentQuestion}
        className="w-full transition-all duration-300 ease-in-out group"
        variant="outline"
      >
        <Phone className="mr-2 h-5 w-5 group-hover:animate-pulse text-accent" />
        Phone-A-Friend
        {isPhoneAFriendUsed && <span className="ml-2 text-xs">(Used)</span>}
      </Button>

      {currentQuestion && (
        <PhoneAFriendDialog
          isOpen={isPhoneAFriendDialogOpen}
          onOpenChange={setIsPhoneAFriendDialogOpen}
          currentQuestion={currentQuestion}
        />
      )}
    </div>
  );
}
