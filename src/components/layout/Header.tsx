
"use client";

import Link from "next/link";
import { Trophy, Brain, Play } from "lucide-react"; // Added Play icon
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 shadow-lg">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-4 sm:mr-6 flex items-center space-x-2 group">
          <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary group-hover:text-accent transition-colors duration-300" />
          <span className="font-bold text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary group-hover:opacity-90 transition-opacity duration-300">
            Cash Me If You Can
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-1 sm:space-x-2">
          <Link href="/play" passHref>
            <Button
              variant="ghost"
              className={cn(
                "text-sm sm:text-base font-medium px-3 sm:px-4 py-2",
                pathname === "/play"
                  ? "text-primary hover:text-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Play className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Game
            </Button>
          </Link>
          <Link href="/leaderboard" passHref>
            <Button
              variant="ghost"
              className={cn(
                "text-sm sm:text-base font-medium px-3 sm:px-4 py-2",
                pathname === "/leaderboard"
                  ? "text-primary hover:text-primary/90"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Leaderboard
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
