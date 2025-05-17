
// src/app/auth/signin/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";

const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

// Inline Google SVG icon
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.6402 9.20455C17.6402 8.60455 17.582 8.00455 17.4729 7.42045H9V10.8068H13.942C13.7279 11.9705 13.0706 12.9545 12.082 13.6205V15.9205H14.792C16.5877 14.3068 17.6402 11.9773 17.6402 9.20455Z" fill="#4285F4"/>
    <path d="M9.00004 17.9998C11.4352 17.9998 13.4682 17.193 14.7921 15.9202L12.0821 13.6202C11.2682 14.1589 10.2352 14.4884 9.00004 14.4884C6.88639 14.4884 5.08185 13.0361 4.37731 11.052L1.57049 13.3975V13.452C2.88185 16.0907 5.72276 17.9998 9.00004 17.9998Z" fill="#34A853"/>
    <path d="M4.37727 11.0523C4.17273 10.4523 4.05000 9.81818 4.05000 9.17045C4.05000 8.52273 4.16364 7.88636 4.36818 7.29545V7.23636L1.57042 4.89199C0.981781 6.00451 0.627273 7.27273 0.627273 8.60227C0.627273 8.93182 0.627273 9.17045 0.627273 9.17045C0.627273 9.17045 0.627273 10.1932 1.57045 13.4523L4.37727 11.0523Z" fill="#FBBC05"/>
    <path d="M9.00004 3.85205C10.3352 3.85205 11.5137 4.31341 12.4182 5.18159L14.8509 2.74864C13.4637 1.47705 11.4352 0.626953 9.00004 0.626953C5.72276 0.626953 2.88185 2.53614 1.57049 5.1725L4.36822 7.51801C5.07276 5.53409 6.88639 3.85205 9.00004 3.85205Z" fill="#EA4335"/>
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { signInWithGoogle, loading: authLoading, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleRedirect = () => {
    const redirectPath = searchParams.get("redirect");
    if (redirectPath) {
      router.push(decodeURIComponent(redirectPath));
    } else {
      router.push("/");
    }
  };
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {
      handleRedirect();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);


  const onSubmit = async (data: SignInFormValues) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: "Signed In Successfully!",
        description: "Welcome back!",
      });
      // Redirect is handled by AuthContext or useEffect above
    } catch (error: any) {
      console.error("Sign in error:", error);
      let errorMessage = "Failed to sign in. Please check your credentials.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please try again.";
      }
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true); // Use same loading state for Google button
    await signInWithGoogle();
    setIsSubmitting(false); // Reset after attempt, redirect handled by AuthContext
  };
  
  const isLoading = isSubmitting || authLoading;

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] py-8">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-md border-primary/30">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">Sign In</CardTitle>
          <CardDescription className="text-muted-foreground">
            Access your account to play "Cash Me If You Can".
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••" 
                          {...field} 
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading && !authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In with Email
              </Button>
            </CardContent>
          </form>
        </Form>
        
        <div className="px-6 pb-2">
            <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
            </div>

            <Button 
                variant="outline" 
                className="w-full border-border hover:bg-muted/50" 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
            >
                {isLoading && authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                Sign in with Google
            </Button>
        </div>

        <CardFooter className="flex flex-col space-y-2 pt-6">
            <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-primary hover:underline">
                <Link href={`/auth/signup${searchParams.get("redirect") ? `?redirect=${searchParams.get("redirect")}` : ''}`}>Sign Up</Link>
            </Button>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
