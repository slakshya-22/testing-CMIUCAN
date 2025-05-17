
"use client"; // Required for useSearchParams

import { GameArea } from "@/components/game/GameArea";
import { useSearchParams } from 'next/navigation';
import { Suspense } from "react"; // Import Suspense

// Wrapper component to use useSearchParams
function PlayPageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || "Mixed";
  const category = searchParams.get('category') || "General Knowledge";

  return <GameArea gameMode={mode} gameCategory={category} />;
}

// Main page component that uses Suspense
export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading game settings...</div>}>
      <PlayPageContent />
    </Suspense>
  );
}
