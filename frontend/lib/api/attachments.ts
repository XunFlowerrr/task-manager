import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface Attachment {
  attachment_id: string;
  attachment_name: string;
  task_id: string;
  file_url: string;
  file_type: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAttachmentData {
  attachmentName: string;
  taskId: string;
  file_url: string;
  file_type: string;
}

export interface UpdateAttachmentData {
  attachmentName?: string;
  file_url?: string;
  file_type?: string;
}

/**
 * Create a new attachment for a task
 */
export async function createAttachment(data: CreateAttachmentData): Promise<{ message: string; attachmentId: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create attachment");
  }

  return response.json();
}

/**
 * Get all attachments for a specific task
 */
export async function getTaskAttachments(taskId: string): Promise<Attachment[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/attachments?taskId=${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch attachments");
  }

  return response.json();
}

/**
 * Get all attachments across all tasks the user has access to
 */
export async function getAllAttachments(): Promise<Attachment[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/attachments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch attachments");
  }

  return response.json();
}

/**
 * Get a specific attachment by ID
 */
export async function getAttachment(id: string): Promise<Attachment> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/attachments/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch attachment");
  }

  return response.json();
}

/**
 * Update an attachment
 */
export async function updateAttachment(id: string, data: UpdateAttachmentData): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/attachments/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update attachment");
  }

  return response.json();
}

/**
 * Delete an attachment
 */
export async function deleteAttachment(id: string): Promise<{ message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.token) {
    throw new Error("No authentication token");
  }
  const token = session.user.token;

  const response = await fetch(`${API_URL}/attachments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete attachment");
  }

  return response.json();
}
