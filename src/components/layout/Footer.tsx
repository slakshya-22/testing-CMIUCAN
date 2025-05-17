
"use client";

import Link from 'next/link';
import { Brain } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-muted-foreground">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
            <Link href="/" className="flex items-center space-x-1.5 group">
              <Brain className="h-5 w-5 text-primary group-hover:text-accent transition-colors duration-300" />
              <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                Cash Me If You Can
              </span>
            </Link>
        </div>
        <p className="text-xs sm:text-sm">
          Created by Lakshya Sharma with ❤️
        </p>
        <p className="text-xs mt-1">
          &copy; {currentYear} All rights reserved.
        </p>
      </div>
    </footer>
  );
}
