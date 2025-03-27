"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/**
 * A simplified hook that provides authentication state and methods
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Logout function that handles NextAuth signout
  const logout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  return {
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    user: session?.user,
    logout,
  };
}

/**
 * A utility function to get the auth token for API calls
 * Uses the session token without localStorage
 */
export function getAuthToken(): string | null {
  // This function will be used by API clients
  if (typeof window === "undefined") {
    return null; // No token on server side
  }

  // The token should come from the session
  // This will be populated by the callbacks in NextAuth
  const session = JSON.parse(
    localStorage.getItem("next-auth.session-token") || "{}"
  );
  return session?.user?.token || null;
}
