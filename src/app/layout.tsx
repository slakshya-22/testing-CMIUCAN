
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: "Cash Me If You Can",
  description: "The ultimate trivia game experience!",
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
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Suspense fallback={
              <div className="flex flex-col justify-center items-center min-h-[calc(100vh-12rem)] p-4">
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
                <p className="text-lg sm:text-xl text-muted-foreground mt-4">Loading page...</p>
              </div>
            }>
              {children}
            </Suspense>
          </main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
