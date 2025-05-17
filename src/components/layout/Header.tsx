
"use client";

import Link from "next/link";
import { Trophy, Brain, Play, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from "@/components/ui/sheet"; // Added SheetTitle, SheetDescription
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const navLinks = [
    { href: "/play", label: "Game", icon: Play },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70 shadow-lg">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2 group">
          <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary group-hover:text-accent transition-colors duration-300" />
          <span className="font-bold text-xl sm:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary group-hover:opacity-90 transition-opacity duration-300">
            Cash Me If You Can
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
          {navLinks.map((link) => (
            <Link href={link.href} passHref key={link.href}>
              <Button
                variant="ghost"
                className={cn(
                  "text-sm sm:text-base font-medium px-3 sm:px-4 py-2",
                  pathname === link.href
                    ? "text-primary hover:text-primary/90 bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <link.icon className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation (Hamburger) */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-primary" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-6 bg-background">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">Main navigation links for the site.</SheetDescription>
              <div className="flex flex-col space-y-4">
                <Link href="/" className="flex items-center space-x-2 group mb-6" onClick={() => setIsSheetOpen(false)}>
                  <Brain className="h-7 w-7 text-primary group-hover:text-accent transition-colors duration-300" />
                  <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                    Cash Me If You Can
                  </span>
                </Link>
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link href={link.href} passHref>
                      <Button
                        variant={pathname === link.href ? "default" : "ghost"}
                        className="w-full justify-start text-md py-3"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        <link.icon className="mr-3 h-5 w-5" />
                        {link.label}
                      </Button>
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
