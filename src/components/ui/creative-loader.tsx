
"use client";

import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreativeLoaderProps {
  className?: string;
  size?: "small" | "medium" | "large";
  text?: string;
}

export function CreativeLoader({ className, size = "medium", text }: CreativeLoaderProps) {
  const brainSizeClasses = {
    small: "h-8 w-8 sm:h-10 sm:w-10",
    medium: "h-12 w-12 sm:h-16 sm:w-16",
    large: "h-20 w-20 sm:h-24 sm:w-24",
  };

  const textSizeClasses = {
    small: "text-sm sm:text-base mt-2",
    medium: "text-lg sm:text-xl mt-4",
    large: "text-xl sm:text-2xl mt-6",
  };

  return (
    <div className={cn("flex flex-col justify-center items-center p-4", className)}>
      <div className="relative">
        <Brain
          className={cn(
            brainSizeClasses[size],
            "text-primary animate-pulse"
          )}
        />
        <div
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-30",
            "bg-gradient-to-br from-accent via-primary to-secondary",
            brainSizeClasses[size]
          )}
          style={{ animationDuration: '1.5s' }}
        ></div>
         <div
          className={cn(
            "absolute inset-0 rounded-full opacity-20",
            "bg-gradient-to-tl from-primary via-accent to-secondary animate-pulse",
            brainSizeClasses[size]
          )}
          style={{ animationDuration: '2s', animationDelay: '0.5s' }}
        ></div>
      </div>
      {text && (
        <p className={cn("text-muted-foreground", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}
