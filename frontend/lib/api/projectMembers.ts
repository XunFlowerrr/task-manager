import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface ProjectMember {
  user_id: string;
  project_id: string;
  username?: string;
  email?: string;
  joined_at?: string; // Make joined_at optional
}

/**
 * Add a member to a project
 */
export async function addProjectMember(projectId: string, userId: string, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/project-members/${projectId}/members`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (jsonError) {
      throw new Error(
        `Failed to add project member: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to add project member: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (addProjectMember):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Remove a member from a project
 */
export async function removeProjectMember(projectId: string, userId: string, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/project-members/${projectId}/members/${userId}`, {
    method: "DELETE",
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
        `Failed to remove project member: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to remove project member: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (removeProjectMember):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get all members of a project
 */
export async function getProjectMembers(projectId: string, token?: string): Promise<ProjectMember[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/project-members/${projectId}/members`, {
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
        `Failed to get project members: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to get project members: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (getProjectMembers):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}
