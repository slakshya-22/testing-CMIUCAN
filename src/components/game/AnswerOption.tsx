"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Answer } from "@/lib/types";

interface AnswerOptionProps {
  answer: Answer;
  onClick: () => void;
  isSelected: boolean;
  isRevealed: boolean;
  isCorrect: boolean;
  disabled: boolean;
}

export function AnswerOption({
  answer,
  onClick,
  isSelected,
  isRevealed,
  isCorrect,
  disabled,
}: AnswerOptionProps) {
  
  const getButtonVariantAndClasses = () => {
    if (isRevealed) {
      if (isCorrect) return { variant: "success" as const, extraClass: "shadow-success/50 ring-2 ring-success-foreground" };
      if (isSelected && !isCorrect) return { variant: "destructive" as const, extraClass: "shadow-destructive/50" };
    }
    if (isSelected) return { variant: "default" as const, extraClass: "ring-2 ring-primary-foreground shadow-primary/40" };
    return { variant: "outline" as const, extraClass: "border-primary/50 hover:bg-primary/10 hover:text-primary" };
  };

  const { variant, extraClass } = getButtonVariantAndClasses();

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full justify-start text-left h-auto py-3.5 px-5 text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md rounded-lg",
        "focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent",
        extraClass,
        {
          // Specific overrides if needed, but variant should handle most cases
          // "bg-green-500 hover:bg-green-600 text-white": isRevealed && isCorrect, // Handled by success variant
          // "bg-red-500 hover:bg-red-600 text-white": isRevealed && isSelected && !isCorrect, // Handled by destructive variant
          // "border-primary ring-2 ring-primary": isSelected && !isRevealed, // Handled by default selected state
          "opacity-60 brightness-75": isRevealed && !isCorrect && !isSelected, // Make unselected incorrect options less prominent
        }
      )}
      variant={variant}
    >
      {answer.text}
    </Button>
  );
}
