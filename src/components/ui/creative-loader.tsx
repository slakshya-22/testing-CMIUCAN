
"use client";

import { cn } from "@/lib/utils";

interface CreativeLoaderProps {
  className?: string;
  size?: "small" | "medium" | "large";
  text?: string;
  textColorClassName?: string; 
}

export function CreativeLoader({
  className,
  size = "medium",
  text,
  textColorClassName = "text-muted-foreground",
}: CreativeLoaderProps) {
  
  const dotSizeClasses = {
    small: "w-2 h-2",
    medium: "w-2.5 h-2.5", // Slightly smaller for better wave effect
    large: "w-3.5 h-3.5",
  };

  const containerHeightClass = { 
    small: "min-h-[4rem]",
    medium: "min-h-[5rem]",
    large: "min-h-[6rem]",
  };

  const textSizeClasses = {
    small: "text-xs sm:text-sm mt-3",
    medium: "text-sm sm:text-base mt-4",
    large: "text-base sm:text-lg mt-5",
  };

  // Base class for each dot, using the 'animate-wave-scale' registered in tailwind.config.ts
  const dotBaseClass = cn("rounded-full animate-wave-scale", dotSizeClasses[size]);

  return (
    <div className={cn("flex flex-col justify-center items-center p-4", containerHeightClass[size], className)}>
      <div className="flex items-center justify-center space-x-2">
        <div className={cn(dotBaseClass, "bg-primary animation-delay-0s")} />
        <div className={cn(dotBaseClass, "bg-accent animation-delay-150ms")} />
        <div className={cn(dotBaseClass, "bg-secondary animation-delay-300ms")} />
        <div className={cn(dotBaseClass, "bg-primary/80 animation-delay-450ms")} />
      </div>
      {text && (
        <p className={cn("text-center", textColorClassName, textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  );
}
