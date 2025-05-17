import type { Metadata } from "next";
// import { GeistSans } from "geist/font/sans"; // Removed problematic import
// import { GeistMono } from "geist/font/mono"; // Removed problematic import
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/toaster";

// const geistSans = GeistSans; // Removed problematic const
// const geistMono = GeistMono; // Removed problematic const

export const metadata: Metadata = {
  title: "Cash Me If You Can",
  description: "The ultimate KBC-style trivia game experience!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`} // Removed geistSans.variable and geistMono.variable
      >
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
