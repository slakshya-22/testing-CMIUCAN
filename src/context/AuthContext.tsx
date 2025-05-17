
// src/context/AuthContext.tsx
"use client";

import type { User } from "firebase/auth";
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut
  // GoogleAuthProvider, // Removed
  // signInWithPopup // Removed
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // signInWithGoogle: () => Promise<void>; // Removed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRedirect = () => {
    const redirectPath = searchParams.get("redirect");
    if (redirectPath) {
      router.push(decodeURIComponent(redirectPath));
    } else {
      router.push("/");
    }
  };

  // Removed signInWithGoogle function

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
      router.push("/"); // Redirect to home page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Error",
        description: "Could not sign you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut /* Removed signInWithGoogle */ }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
