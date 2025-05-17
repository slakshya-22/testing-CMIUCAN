
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center p-4 sm:p-6 md:p-8">
      <Brain className="h-20 w-20 sm:h-24 sm:w-24 text-primary mb-6 animate-pulse" />
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 sm:mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
        Cash Me If You Can
      </h1>
      <p className="text-lg sm:text-xl text-muted-foreground mb-10 sm:mb-12 max-w-md md:max-w-lg">
        Step into the hot seat! Test your knowledge in this thrilling KBC-inspired trivia game and climb the leaderboard.
      </p>
      <Button
        asChild
        size="lg"
        className="animate-bounce shadow-lg hover:shadow-primary/50 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5"
      >
        <Link href="/play">
          <PlayCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> Play Now
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
