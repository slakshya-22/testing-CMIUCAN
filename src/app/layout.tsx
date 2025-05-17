
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer"; // Added Footer
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Cash Me If You Can",
  description: "The ultimate trivia game experience!", // Removed KBC reference
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer /> {/* Added Footer */}
        <Toaster />
      </body>
    </html>
  );
}
