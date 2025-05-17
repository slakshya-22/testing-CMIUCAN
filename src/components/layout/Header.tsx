"use client";

import Link from "next/link";
import { Gamepad2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Gamepad2 className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            TriviMaster
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-2">
          <Link href="/" passHref>
            <Button
              variant="ghost"
              className={cn(
                "text-sm font-medium",
                pathname === "/"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Game
            </Button>
          </Link>
          <Link href="/leaderboard" passHref>
            <Button
              variant="ghost"
              className={cn(
                "text-sm font-medium",
                pathname === "/leaderboard"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="mr-2 h-4 w-4" />
              Leaderboard
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
