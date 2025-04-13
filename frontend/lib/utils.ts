import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  dateString: string | null | undefined,
  dateFormat: string = "PPP"
): string {
  if (!dateString) return "N/A";
  try {
    return format(new Date(dateString), dateFormat);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
}

export function formatPriority(priority: number): string {
  switch (priority) {
    case 1:
      return "Low";
    case 2:
      return "Medium";
    case 3:
      return "High";
    default:
      return "Unknown";
  }
}

export function getPriorityBadgeVariant(
  priority: number
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case 1:
      return "secondary"; // Low
    case 2:
      return "default"; // Medium (using default blueish)
    case 3:
      return "destructive"; // High
    default:
      return "outline";
  }
}

export function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" | "success" {
  switch (status?.toLowerCase()) {
    case "pending":
      return "secondary";
    case "in-progress":
      return "default"; // Blueish
    case "completed":
      return "success"; // Need to define 'success' variant or use existing
    default:
      return "outline";
  }
}

// Add a 'success' variant style if needed, or map 'completed' to an existing one.
// For now, let's assume 'success' exists or map it to 'default' temporarily.
// If using Shadcn UI Badge, you might need to add a 'success' variant in globals.css or badge.tsx.
