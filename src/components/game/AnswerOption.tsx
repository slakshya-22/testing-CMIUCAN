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
  
  const getButtonVariant = () => {
    if (isRevealed) {
      if (isCorrect) return "success";
      if (isSelected && !isCorrect) return "destructive";
    }
    if (isSelected) return "default";
    return "outline";
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full justify-start text-left h-auto py-3 px-4 text-base md:text-lg transition-all duration-300 ease-in-out transform hover:scale-105",
        {
          "bg-green-500 hover:bg-green-600 text-white": isRevealed && isCorrect,
          "bg-red-500 hover:bg-red-600 text-white": isRevealed && isSelected && !isCorrect,
          "border-primary ring-2 ring-primary": isSelected && !isRevealed,
          "opacity-70": isRevealed && !isCorrect && !isSelected,
        }
      )}
      variant={getButtonVariant() === 'default' ? 'default' : getButtonVariant() === 'destructive' ? 'destructive' : 'outline'}
    >
      {answer.text}
    </Button>
  );
}
