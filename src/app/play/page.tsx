
"use client";

import { GameArea } from "@/components/game/GameArea";
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

function PlayPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();

  const mode = searchParams.get('mode') || "Mixed";
  const category = searchParams.get('category') || "General Knowledge";

  useEffect(() => {
    if (!loading && !user) {
      // Save current path to redirect back after login
      const redirectTo = `/play?mode=${mode}&category=${encodeURIComponent(category)}`;
      router.push(`/auth/signin?redirect=${encodeURIComponent(redirectTo)}`);
    }
  }, [user, loading, router, mode, category]);

  if (loading || !user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-12rem)] p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg sm:text-xl text-muted-foreground mt-4">
          {loading ? "Authenticating..." : "Redirecting to sign in..."}
        </p>
      </div>
    );
  }

  return <GameArea gameMode={mode} gameCategory={category} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-12rem)] p-4">
        <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        <p className="ml-4 text-lg sm:text-xl text-muted-foreground mt-4">Loading game settings...</p>
      </div>
    }>
      <PlayPageContent />
    </Suspense>
  );
}
