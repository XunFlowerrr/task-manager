"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * A hook that handles client-side auth state synchronization
 * This ensures the token from NextAuth session is stored in localStorage
 * for use with API requests that require authentication
 */
export function useAuth() {
  const { data: session } = useSession();
  const router = useRouter();

  // Sync the token to localStorage when the session changes
  useEffect(() => {
    if (session?.user?.token) {
      localStorage.setItem("token", session.user.token as string);
    } else {
      // If no session or no token, clear the localStorage token
      if (!session) {
        localStorage.removeItem("token");
      }
    }
  }, [session]);

  // Logout function
  const logout = async () => {
    // Clear local storage first
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }

    // End NextAuth session
    await signOut({ redirect: false });

    // Redirect to login page
    router.push("/login");
  };

  return {
    token: session?.user?.token as string | undefined,
    isAuthenticated: !!session,
    user: session?.user,
    logout,
  };
}

/**
 * A utility function to get the auth token for API calls
 * Can be used outside of React components
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}
