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
  task_description?: string | null;
  start_date?: string | null; // Format: YYYY-MM-DD
  due_date?: string | null; // Format: YYYY-MM-DD
  status: "pending" | "in-progress" | "completed";
  priority: number; // Assuming 1=Low, 2=Medium, 3=High
  created_date: string;
  updated_date: string;
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
  taskDescription?: string | null;
  startDate?: string | null; // Format: YYYY-MM-DD
  dueDate?: string | null; // Format: YYYY-MM-DD
  status?: "pending" | "in-progress" | "completed";
  priority?: number;
  assignees?: string[];
}

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskData, token?: string): Promise<{ message: string; taskId: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (jsonError) {
      throw new Error(
        `Failed to create task: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to create task: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (createTask):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get all tasks for a project
 */
export async function getAllTasks(projectId: string, token?: string): Promise<Task[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks?projectId=${projectId}`, {
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
        `Failed to fetch tasks: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to fetch tasks: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (getAllTasks):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get a specific task by ID
 */
export async function getTask(id: string, token?: string): Promise<Task> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks/${id}`, {
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
        `Failed to fetch task: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to fetch task: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (getTask):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Updates an existing task.
 * @param taskId The ID of the task to update.
 * @param taskData The data to update.
 * @param token The user's authentication token.
 * @returns The updated task data.
 */
export async function updateTask(
  taskId: string,
  taskData: UpdateTaskData,
  token?: string
): Promise<Task> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (jsonError) {
      throw new Error(
        `Failed to update task: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to update task: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (updateTask):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Deletes a task.
 * @param taskId The ID of the task to delete.
 * @param token The user's authentication token.
 * @returns void
 */
export const deleteTask = async (
  taskId: string,
  token?: string
): Promise<void> => {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (jsonError) {
      throw new Error(
        `Failed to delete task: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to delete task: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return;
  }

  try {
    await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (deleteTask):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
};

/**
 * Get assignees for a task
 */
export async function getTaskAssignees(taskId: string, token?: string): Promise<Assignee[]> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees`, {
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
        `Failed to fetch task assignees: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to fetch task assignees: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (getTaskAssignees):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Assign a user to a task
 */
export async function assignUserToTask(taskId: string, userId: string, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees`, {
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
        `Failed to assign user to task: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to assign user to task: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (assignUserToTask):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Remove a user assignment from a task
 */
export async function unassignUserFromTask(taskId: string, userId: string, token?: string): Promise<{ message: string }> {
  if (!token) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.token) {
      throw new Error("No authentication token");
    }
    token = session.user.token;
  }

  const response = await fetch(`${API_URL}/tasks/${taskId}/assignees/${userId}`, {
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
        `Failed to unassign user from task: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to unassign user from task: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return { message: "Task unassigned successfully" };
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (unassignUserFromTask):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}

/**
 * Get tasks assigned to the current user
 */
export async function getUserTasks(token?: string): Promise<Task[]> {
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
        `Failed to fetch user tasks: ${response.status} ${response.statusText}. Server responded with: ${errorText}`
      );
    }
    throw new Error(errorData?.error || `Failed to fetch user tasks: ${response.status} ${response.statusText}`);
  }

  try {
    return await response.json();
  } catch (jsonError) {
    console.error("Failed to parse successful response JSON (getUserTasks):", jsonError);
    throw new Error(`Received OK status (${response.status}) but failed to parse JSON response.`);
  }
}
