"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface Project {
  project_id: string;
  project_name: string;
  project_description: string;
  owner_id: string;
  category: string;
  created_date: string; // Changed from created_at to match backend
  updated_date: string; // Changed from updated_at to match backend
  progress?: number; // Added progress field that's coming from backend
}

export interface CreateProjectData {
  projectName: string;
  projectDescription?: string;
  category: string;
}

export interface UpdateProjectData {
  projectName?: string;
  projectDescription?: string;
  category?: string;
}

/**
 * Create a new project
 */
export async function createProject(data: CreateProjectData, token?: string): Promise<{ message: string; projectId: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text(); // Read body as text first
    let errorData;
    try {
      errorData = JSON.parse(errorText); // Try parsing the text
    } catch (jsonError) {
      // If parsing fails, use the raw text
      throw new Error(
        `Failed to create project: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    // If parsing succeeds, use the parsed error message if available
    throw new Error(errorData?.error || `Failed to create project: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    // If server sends 201 Created but invalid JSON
    console.error("Failed to parse successful response JSON (createProject):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get all projects that the user has access to - client version
 */
export async function getAllProjectsClient(token: string): Promise<Project[]> {
  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text(); // Read body as text first
    let errorData;
    try {
      errorData = JSON.parse(errorText); // Try parsing the text
    } catch (jsonError) {
      // If parsing fails, use the raw text
      throw new Error(
        `Failed to fetch projects (client): ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    // If parsing succeeds, use the parsed error message if available
    throw new Error(errorData?.error || `Failed to fetch projects (client): ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    // If server sends 200 OK but invalid JSON
    console.error("Failed to parse successful response JSON (getAllProjectsClient):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get all projects that the user has access to
 */
export async function getAllProjects(token?: string): Promise<Project[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text(); // Read body as text first
    let errorData;
    try {
      errorData = JSON.parse(errorText); // Try parsing the text
    } catch (jsonError) {
      // If parsing fails, use the raw text
      throw new Error(
        `Failed to fetch projects: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    // If parsing succeeds, use the parsed error message if available
    throw new Error(errorData?.error || `Failed to fetch projects: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    // If server sends 200 OK but invalid JSON
    console.error("Failed to parse successful response JSON (getAllProjects):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get a specific project by ID
 */
export async function getProject(id: string, token?: string): Promise<Project> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text(); // Read body as text first
    let errorData;
    try {
      errorData = JSON.parse(errorText); // Try parsing the text
    } catch (jsonError) {
      // If parsing fails, use the raw text
      throw new Error(
        `Failed to fetch project: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    // If parsing succeeds, use the parsed error message if available
    throw new Error(errorData?.error || `Failed to fetch project: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    // If server sends 200 OK but invalid JSON
    console.error("Failed to parse successful response JSON (getProject):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Update a project
 */
export async function updateProject(id: string, data: UpdateProjectData, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text(); // Read body as text first
    let errorData;
    try {
      errorData = JSON.parse(errorText); // Try parsing the text
    } catch (jsonError) {
      // If parsing fails, use the raw text
      throw new Error(
        `Failed to update project: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    // If parsing succeeds, use the parsed error message if available
    throw new Error(errorData?.error || `Failed to update project: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    // If server sends 200 OK but invalid JSON
    console.error("Failed to parse successful response JSON (updateProject):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: string, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text(); // Read body as text first
    let errorData;
    try {
      errorData = JSON.parse(errorText); // Try parsing the text
    } catch (jsonError) {
      // If parsing fails, use the raw text
      throw new Error(
        `Failed to delete project: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    // If parsing succeeds, use the parsed error message if available
    throw new Error(errorData?.error || `Failed to delete project: ${response.status} ${response.statusText}`);
  }

  // For DELETE, often a 204 No Content is returned, or sometimes a 200/202 with a message.
  // Handle 204 specifically as it has no body.
  if (response.status === 204) {
    return { message: "Project deleted successfully" };
  }

  try {
    return await response.json();
  } catch (jsonError) {
    // If server sends 200 OK but invalid JSON
    console.error("Failed to parse successful response JSON (deleteProject):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}
