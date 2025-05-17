
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle, Brain, Settings, ChevronRight, Tv, Sparkles, HelpCircle, Mail, Gamepad2, Workflow, Layers, Rocket, Smartphone, UserCircle, LogIn, Loader2, Trophy } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type GameMode = "Mixed" | "Easy" | "Medium" | "Hard";
type GameCategory = "General Knowledge" | "Sports" | "History" | "Geography" | "Science";

export default function HomePage() {
  const [selectedMode, setSelectedMode] = useState<GameMode>("Mixed");
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>("General Knowledge");
  const { user, loading } = useAuth();
  const router = useRouter();

  const gameModes: GameMode[] = ["Mixed", "Easy", "Medium", "Hard"];
  const gameCategories: GameCategory[] = [
    "General Knowledge",
    "Sports",
    "History",
    "Geography",
    "Science",
  ];

  const faqItems = [
    {
      value: "item-1",
      question: "How are points awarded?",
      answer: "Points are awarded based on question difficulty, following a progressive scale. The further you get, the more points each question is worth, leading to a high-stakes, exciting finish!"
    },
    {
      value: "item-2",
      question: "Are the questions different each time I play?",
      answer: "Absolutely! Our game uses advanced AI to generate fresh and unique trivia questions for every session, ensuring a new challenge every time you play."
    },
    {
      value: "item-3",
      question: "How do the lifelines work?",
      answer: "You have three powerful lifelines: 50:50 (removes two incorrect answers), Phone-A-Friend (gets an AI-generated hint), and Audience Poll (shows how a virtual audience 'voted'). Use them wisely!"
    },
    {
      value: "item-4",
      question: "Can I play on my mobile device?",
      answer: "Yes! Cash Me If You Can is fully responsive and designed to provide a seamless experience on desktops, tablets, and mobile phones."
    },
    {
      value: "item-5",
      question: "What happens if I answer incorrectly?",
      answer: "If you answer a question incorrectly, the game ends. Your current score will be recorded, and you'll have the option to save it to the leaderboard if it's a high score!"
    }
  ];

  const handlePlayNowClick = () => {
    if (!user && !loading) {
      router.push(`/auth/signin?redirect=/play?mode=${selectedMode}&category=${encodeURIComponent(selectedCategory)}`);
    } else if (user) {
      router.push(`/play?mode=${selectedMode}&category=${encodeURIComponent(selectedCategory)}`);
    }
  };
  
  const handleConfigureAndPlayClick = () => {
    if (!user && !loading) {
      router.push('/auth/signin?redirect=/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-4 sm:p-6 md:p-8 space-y-16 sm:space-y-20 md:space-y-24">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center">
        <Brain className="h-20 w-20 sm:h-24 sm:w-24 text-primary mb-4 animate-pulse" />
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary">
          Cash Me If You Can
        </h1>
        {user && (
          <p className="text-xl sm:text-2xl text-accent mb-4">
            Welcome back, {user.displayName || user.email?.split('@')[0]}!
          </p>
        )}
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-md md:max-w-lg">
          Step into the hot seat! Test your knowledge in this thrilling trivia game and climb the leaderboard.
        </p>

        <Card className="w-full max-w-md mb-8 sm:mb-10 shadow-2xl bg-card/80 backdrop-blur-md border-2 border-primary/30 rounded-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center justify-center text-primary">
              <Settings className="mr-2 h-6 w-6" /> Game Settings
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Customize your trivia challenge!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="grid gap-2 text-left">
              <Label htmlFor="game-mode" className="text-md font-medium text-foreground">Game Mode (Difficulty)</Label>
              <Select value={selectedMode} onValueChange={(value) => setSelectedMode(value as GameMode)} disabled={loading}>
                <SelectTrigger id="game-mode" className="w-full text-base py-3 h-auto bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {gameModes.map((mode) => (
                    <SelectItem key={mode} value={mode} className="text-base">
                      {mode === "Mixed" ? "Mixed Difficulty" : mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 text-left">
              <Label htmlFor="game-category" className="text-md font-medium text-foreground">Category</Label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as GameCategory)} disabled={loading}>
                <SelectTrigger id="game-category" className="w-full text-base py-3 h-auto bg-input border-border focus:ring-primary">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {gameCategories.map((category) => (
                    <SelectItem key={category} value={category} className="text-base">
                      {category === "General Knowledge" ? "General Knowledge (Mixed)" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handlePlayNowClick}
          size="lg"
          className="animate-bounce shadow-lg hover:shadow-primary/50 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 group"
          disabled={loading}
        >
          {loading && !user ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <PlayCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7" />}
          Play Now
          {!loading && <ChevronRight className="ml-2 h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:translate-x-1" />}
        </Button>
        {!user && !loading && (
          <p className="mt-4 text-sm text-muted-foreground">
            <Link href="/auth/signin" className="text-primary hover:underline flex items-center">
              <LogIn className="mr-1 h-4 w-4" /> Sign in to play
            </Link>
          </p>
        )}
        
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
      </section>

      {/* About the Game Section */}
      <section className="w-full max-w-3xl lg:max-w-4xl px-2">
        <Card className="shadow-2xl bg-card/80 backdrop-blur-md border-primary/30 rounded-xl">
          <CardHeader className="text-center">
            <div className="inline-block mx-auto p-3 bg-gradient-to-br from-primary via-accent to-secondary rounded-full mb-3 shadow-lg">
                <Tv className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Step Into the Spotlight!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground text-lg space-y-4 px-6 pb-8">
            <p>
              Welcome to "Cash Me If You Can," the ultimate trivia challenge where knowledge is power and quick thinking pays off! 
              Prepare to test your wits across various categories and difficulty levels.
            </p>
            <p>
              Answer 15 progressively harder questions, use your lifelines strategically, and aim for the top of the leaderboard. 
              Every game is a fresh experience thanks to our AI-powered question engine.
            </p>
            <div data-ai-hint="quiz interface simple" className="flex justify-center my-6">
              <Image 
                src="https://placehold.co/500x300.png" 
                alt="Game interface example" 
                width={500} 
                height={300} 
                className="rounded-lg shadow-md border border-border"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How It Works Section */}
      <section className="w-full max-w-3xl lg:max-w-4xl px-2">
        <Card className="shadow-2xl bg-card/80 backdrop-blur-md border-secondary/30 rounded-xl">
          <CardHeader className="text-center">
            <div className="inline-block mx-auto p-3 bg-gradient-to-br from-secondary via-accent to-primary rounded-full mb-3 shadow-lg">
              <Workflow className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-secondary">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-left text-muted-foreground text-lg space-y-6 px-6 sm:px-8 pb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                {[
                  { num: 1, title: "Sign Up / Sign In", description: "Create an account or sign in to track your progress and appear on the leaderboard." },
                  { num: 2, title: "Customize Your Challenge", description: "Select your preferred game mode (difficulty) and category before you start. Or, go with \"Mixed\" for a diverse experience!" },
                  { num: 3, title: "Answer & Ascend", description: "Tackle 15 questions, each more challenging and valuable than the last. Race against the clock to lock in your answers." },
                  { num: 4, title: "Use Lifelines Wisely", description: "Feeling stuck? Utilize 50:50, Phone-A-Friend, or Audience Poll to gain an edge. But remember, each can only be used once!" },
                  { num: 5, title: "Climb the Leaderboard", description: "After your game, save your score and see how you rank against other trivia masters. Aim for the top spot!" }
                ].map(step => (
                  <div key={step.num} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mt-1 shadow-md">{step.num}</div>
                    <div>
                      <h4 className="font-semibold text-xl text-primary mb-1">{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div data-ai-hint="flowchart diagram" className="hidden md:flex justify-center items-center">
                <Image
                  src="https://placehold.co/400x500.png"
                  alt="Game Flow Diagram"
                  width={400}
                  height={500}
                  className="rounded-lg shadow-xl border-2 border-secondary/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Key Features Section */}
      <section className="w-full max-w-3xl lg:max-w-4xl px-2">
        <Card className="shadow-2xl bg-card/80 backdrop-blur-md border-accent/30 rounded-xl">
          <CardHeader className="text-center">
             <div className="inline-block mx-auto p-3 bg-gradient-to-br from-accent via-primary to-secondary rounded-full mb-3 shadow-lg">
                <Sparkles className="h-10 w-10 text-accent-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-accent">Why You'll Love It</CardTitle>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 text-left text-muted-foreground text-lg">
              {[
                { icon: Brain, title: "Dynamic AI Questions", description: "Enjoy a fresh set of challenges every time you play, thanks to our AI-powered question generation." },
                { icon: Settings, title: "Customizable Gameplay", description: "Choose your preferred difficulty and category to tailor the game to your strengths." },
                { icon: Gamepad2, title: "Engaging Lifelines", description: "Use 50:50, Phone-A-Friend, and Audience Poll to navigate tough questions." },
                { icon: Layers, title: "Progressive Difficulty", description: "Questions get tougher as you advance, making each step more rewarding." },
                { icon: Trophy, title: "Competitive Leaderboard", description: "Save your high scores and compete for the top spot against other players." },
                { icon: Smartphone, title: "Sleek & Responsive", description: "Play seamlessly on any device, with a modern and intuitive interface." },
              ].map(feature => (
                <div key={feature.title} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors duration-200">
                  <feature.icon className="h-7 w-7 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-xl text-foreground mb-1">{feature.title}</h4>
                    <p className="text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
             <div data-ai-hint="feature collage abstract" className="flex justify-center mt-8">
                <Image
                  src="https://placehold.co/600x350.png"
                  alt="Game Features Collage"
                  width={600}
                  height={350}
                  className="rounded-lg shadow-xl border-2 border-accent/20"
                />
              </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQs Section */}
      <section className="w-full max-w-3xl lg:max-w-4xl px-2">
        <Card className="shadow-2xl bg-card/80 backdrop-blur-md border-primary/30 rounded-xl">
          <CardHeader className="text-center">
            <div className="inline-block mx-auto p-3 bg-gradient-to-br from-primary via-accent to-secondary rounded-full mb-3 shadow-lg">
                <HelpCircle className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-primary">Got Questions? We've Got Answers!</CardTitle>
          </CardHeader>
          <CardContent className="px-6 sm:px-8 pb-8">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map(faq => (
                <AccordionItem value={faq.value} key={faq.value} className="border-primary/20">
                  <AccordionTrigger className="text-lg text-left hover:no-underline text-foreground data-[state=open]:text-primary data-[state=open]:font-semibold py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-left text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Get In Touch Section */}
      <section className="w-full max-w-3xl lg:max-w-4xl px-2">
        <Card className="shadow-2xl bg-card/80 backdrop-blur-md border-secondary/30 rounded-xl">
          <CardHeader className="text-center">
            <div className="inline-block mx-auto p-3 bg-gradient-to-br from-secondary via-accent to-primary rounded-full mb-3 shadow-lg">
                <Mail className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold text-secondary">We'd Love to Hear From You!</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground text-lg space-y-6 px-6 pb-8">
            <p>
              Have feedback, suggestions, or just want to say hi? We're always looking to improve "Cash Me If You Can."
            </p>
            <div data-ai-hint="contact support icons" className="flex justify-center my-6">
                <Image
                  src="https://placehold.co/400x250.png"
                  alt="Contact or Feedback illustration"
                  width={400}
                  height={250}
                  className="rounded-lg shadow-md border border-border"
                />
            </div>
            <p className="text-sm">
              (This is a placeholder. In a real app, you might find a contact form or email address here.)
            </p>
            <Button variant="outline" className="mt-4 border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary-foreground text-lg px-6 py-3">
              Send Feedback (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </section>

       {/* Final Call to Action */}
      <section className="w-full flex flex-col items-center py-10">
        <Rocket className="h-16 w-16 text-accent mb-4 animate-bounce" />
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-primary">Ready to Test Your Knowledge?</h2>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-md">
          The hot seat is waiting. Choose your settings above and start your journey to trivia stardom!
        </p>
        <div data-ai-hint="rocket launch success" className="flex justify-center mb-8">
            <Image
              src="https://placehold.co/500x300.png"
              alt="Rocket launching towards stars"
              width={500}
              height={300}
              className="rounded-lg shadow-xl border-2 border-accent/20"
            />
        </div>
        <Button
          size="lg"
          className="shadow-lg hover:shadow-primary/50 text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-5 group bg-gradient-to-r from-primary via-accent to-secondary hover:opacity-90 text-primary-foreground"
          onClick={handleConfigureAndPlayClick}
          disabled={loading && !user}
        >
            <PlayCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> Configure & Play
        </Button>
      </section>
    </div>
  );
}
