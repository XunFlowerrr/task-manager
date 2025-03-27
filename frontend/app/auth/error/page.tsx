"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    let errorMessage = "An authentication error occurred";

    // Handle different NextAuth error types
    if (errorParam === "CredentialsSignin") {
      errorMessage = "Invalid email or password. Please try again.";
    } else if (errorParam === "SessionRequired") {
      errorMessage = "You must be signed in to access this page";
    } else if (errorParam === "AccessDenied") {
      errorMessage = "You don't have permission to access this resource";
    } else if (errorParam) {
      errorMessage = `Authentication error: ${errorParam}`;
    }

    setError(errorMessage);
  }, [searchParams]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Authentication Error</CardTitle>
            <CardDescription>
              There was a problem with your authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <div className="flex flex-col gap-4">
              <Button asChild>
                <Link href="/login">Return to Login</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
