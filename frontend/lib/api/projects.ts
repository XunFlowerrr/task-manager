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
 * Create a new project
 */
export async function createProject(data: CreateProjectData): Promise<{ message: string; projectId: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.user.token}`,
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
 * Get all projects that the user has access to
 */
export async function getAllProjects(): Promise<Project[]> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.user.token}`,
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
 * Get a specific project by ID
 */
export async function getProject(id: string): Promise<Project> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.user.token}`,
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
 * Update a project
 */
export async function updateProject(id: string, data: UpdateProjectData): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.user.token}`,
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
 * Delete a project
 */
export async function deleteProject(id: string): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_URL}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session.user.token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete project");
  }

  return response.json();
}
