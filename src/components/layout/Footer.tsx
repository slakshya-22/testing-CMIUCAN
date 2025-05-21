
"use client";

import Link from 'next/link';
import { Brain, Github, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const contributors = [
    "Nupur Panwar",
    "Pranjal Kumar Rai",
    "Junjaram Choudhary",
    "Gaurav Gehlot",
    "Lakshya Sharma"
  ];

  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-muted-foreground">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center space-y-6 md:space-y-0">
          
          {/* Left: Contributors */}
          <div className="text-xs sm:text-sm text-center md:text-left order-2 md:order-1">
            Created with ❤️ by:
            <div className="mt-1">
              {contributors.map((name) => (
                <span key={name} className="block">{name}</span>
              ))}
            </div>
          </div>

          {/* Center: Game Name/Logo */}
          <div className="order-1 md:order-2 flex-shrink-0 mx-auto md:mx-0"> {/* flex-shrink-0 prevents shrinking, mx-auto for mobile centering if needed */}
            <Link href="/" className="flex items-center space-x-1.5 group">
              <Brain className="h-6 w-6 text-primary group-hover:text-accent transition-colors duration-300" />
              <span className="font-semibold text-md text-foreground group-hover:text-primary transition-colors">
                Cash Me If You Can
              </span>
            </Link>
          </div>

          {/* Right: Social Icons */}
          <div className="flex space-x-5 order-3 md:order-3">
            <a href="https://github.com/Lakshyasharma0410" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors duration-300">
              <Github className="h-6 w-6" />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors duration-300"> {/* Replace # with actual Instagram link */}
              <Instagram className="h-6 w-6" />
              <span className="sr-only">Instagram</span>
            </a>
            <a href="https://www.linkedin.com/in/lakshya-sharma-448064229/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors duration-300">
              <Linkedin className="h-6 w-6" />
              <span className="sr-only">LinkedIn</span>
            </a>
          </div>
        </div>

        {/* Copyright - Centered below the main content */}
        <p className="text-xs text-center mt-8">
          &copy; {currentYear} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
