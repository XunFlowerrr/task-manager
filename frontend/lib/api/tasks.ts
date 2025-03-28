import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface Assignee {
  user_id: string;
  username?: string;
  email?: string;
}

export interface Task {
  task_id: string;
  project_id: string;
  task_name: string;
  task_description: string;
  start_date: string | null;
  due_date: string | null;
  status: string;
  priority: number;
  created_at: string;
  updated_at: string;
  assignees?: Assignee[];
}

export interface CreateTaskData {
  projectId: string;
  taskName: string;
  taskDescription?: string;
  startDate?: string;
  dueDate?: string;
  status?: string;
  priority?: number;
  assignees?: string[];
}

export interface UpdateTaskData {
  taskName?: string;
  taskDescription?: string;
  startDate?: string;
  dueDate?: string;
  status?: string;
  priority?: number;
  assignees?: string[];
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskData): Promise<{ message: string; taskId: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create task");
  }

  return response.json();
}

/**
 * Get all tasks for a project
 */
export async function getAllTasks(projectId: string): Promise<Task[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks?projectId=${projectId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch tasks");
  }

  return response.json();
}

/**
 * Get a specific task by ID
 */
export async function getTask(id: string): Promise<Task> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch task");
  }

  return response.json();
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: UpdateTaskData): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update task");
  }

  return response.json();
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete task");
  }

  return response.json();
}

/**
 * Get assignees for a task
 */
export async function getTaskAssignees(taskId: string): Promise<Assignee[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch task assignees");
  }

  return response.json();
}

/**
 * Assign a user to a task
 */
export async function assignUserToTask(taskId: string, userId: string): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to assign user to task");
  }

  return response.json();
}

/**
 * Remove a user assignment from a task
 */
export async function unassignUserFromTask(taskId: string, userId: string): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to unassign user from task");
  }

  return response.json();
}

// Original server-side version
export async function getUserTasks(token?: string): Promise<Task[]> {
  // If token is provided, use it; otherwise, get it from the session
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch user tasks");
  }

  return response.json();
}
