
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle, Brain, Settings, ChevronRight } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type GameMode = "Mixed" | "Easy" | "Medium" | "Hard";
type GameCategory = "General Knowledge" | "Sports" | "History" | "Geography" | "Science";

export default function HomePage() {
  const [selectedMode, setSelectedMode] = useState<GameMode>("Mixed");
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("General Knowledge");

  const gameModes: GameMode[] = ["Mixed", "Easy", "Medium", "Hard"];
  const gameCategories: GameCategory[] = [
    "General Knowledge",
    "Sports",
    "History",
    "Geography",
    "Science",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)] text-center p-4 sm:p-6 md:p-8">
      <Brain className="h-20 w-20 sm:h-24 sm:w-24 text-primary mb-4 animate-pulse" />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
        Cash Me If You Can
      </h1>
      <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-md md:max-w-lg">
        Step into the hot seat! Test your knowledge in this thrilling trivia game and climb the leaderboard.
      </p>

      <Card className="w-full max-w-md mb-8 sm:mb-10 shadow-xl bg-card/80 backdrop-blur-md border-primary/20 rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-center text-primary">
            <Settings className="mr-2 h-6 w-6" /> Game Settings
          </CardTitle>
          <CardDescription className="text-center">
            Customize your trivia challenge!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="grid gap-2 text-left">
            <Label htmlFor="game-mode" className="text-md font-medium text-foreground">Game Mode</Label>
            <Select value={selectedMode} onValueChange={(value) => setSelectedMode(value as GameMode)}>
              <SelectTrigger id="game-mode" className="w-full text-base py-3 h-auto bg-input border-border focus:ring-primary">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                {gameModes.map((mode) => (
                  <SelectItem key={mode} value={mode} className="text-base">
                    {mode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 text-left">
            <Label htmlFor="game-category" className="text-md font-medium text-foreground">Category</Label>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as GameCategory)}>
              <SelectTrigger id="game-category" className="w-full text-base py-3 h-auto bg-input border-border focus:ring-primary">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {gameCategories.map((category) => (
                  <SelectItem key={category} value={category} className="text-base">
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button
        asChild
        size="lg"
        className="animate-bounce shadow-lg hover:shadow-primary/50 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 group"
      >
        <Link href={`/play?mode=${selectedMode}&category=${encodeURIComponent(selectedCategory)}`}>
          <PlayCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> Play Now
          <ChevronRight className="ml-2 h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1" />
        </Link>
      </Button>
      
      <div className="mt-10 sm:mt-12" data-ai-hint="game show stage lights">
        <Image
          src="https://placehold.co/700x400.png"
          alt="Cash Me If You Can Game Stage"
          width={700}
          height={400}
          className="rounded-lg shadow-2xl border-2 border-primary/30 w-full max-w-lg md:max-w-xl lg:max-w-2xl"
          priority
        />
      </div>
    </div>
  );
}
