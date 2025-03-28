"use server"

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const API_URL = process.env.BACKEND_URL || "http://localhost:5000/api/v1";

export interface Project {
  project_id: string;
  project_name: string;
  project_description: string;
  owner_id: string;
  category: string;
  created_at: string;
  updated_at: string;
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
 * Get server-side auth token from the session
 */
async function getServerToken(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.token || null;
}

/**
 * Create a new project (server-side)
 */
export async function createProject(data: CreateProjectData): Promise<{ message: string; projectId: string }> {
  const token = await getServerToken();

  if (!token) {
    throw new Error("No authentication token");
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
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create project");
  }

  return response.json();
}

/**
 * Get all projects that the user has access to (server-side)
 */
export async function getAllProjects(): Promise<Project[]> {
  const token = await getServerToken();

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
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch projects");
  }

  return response.json();
}

/**
 * Get a specific project by ID (server-side)
 */
export async function getProject(id: string): Promise<Project> {
  const token = await getServerToken();

  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch project");
  }

  return response.json();
}

/**
 * Update a project (server-side)
 */
export async function updateProject(id: string, data: UpdateProjectData): Promise<{ message: string }> {
  const token = await getServerToken();

  if (!token) {
    throw new Error("No authentication token");
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
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update project");
  }

  return response.json();
}

/**
 * Delete a project (server-side)
 */
export async function deleteProject(id: string): Promise<{ message: string }> {
  const token = await getServerToken();

  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete project");
  }

  return response.json();
}
