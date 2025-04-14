import { Request } from "express";

export interface User {
  user_id: string;
  username: string;
  email: string;
  password?: string; // Optional when returning user data
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Project {
  project_id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Task {
  task_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: Date;
  project_id: string;
  assignee_id?: string;
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProjectMember {
  member_id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at?: Date;
}

export interface ProjectInvitation {
  invitation_id: string;
  project_id: string;
  user_id: string;
  invited_by: string;
  status: string;
  created_at?: Date;
  expires_at?: Date;
}

export interface Attachment {
  attachment_id: string;
  task_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at?: Date;
}

// Extend the Express Request interface to include user from auth middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}
