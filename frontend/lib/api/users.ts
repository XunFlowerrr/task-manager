import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Define the structure of the user search result
export interface UserSearchResult {
  user_id: string;
  username: string;
  email: string;
}

/**
 * Search for users by query, excluding members of a specific project.
 */
export async function searchUsers(query: string, projectId: string, token?: string): Promise<UserSearchResult[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  if (!query.trim()) {
    return []; // Don't search if query is empty
  }

  // Encode query parameters
  const params = new URLSearchParams({
    q: query,
    projectId: projectId,
  });

  const response = await fetch(`${API_URL}/users/search?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (jsonError) {
      throw new Error(
        `Failed to search users: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to search users: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (searchUsers):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}
