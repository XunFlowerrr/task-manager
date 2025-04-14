import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  dateString: string | null | undefined,
  dateFormat: string = "PPP"
): string {
  if (!dateString) return "N/A";
  try {
    return dateFnsFormat(new Date(dateString), dateFormat);
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

/**
 * Returns today's date in YYYY-MM-DD format.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates a CSS linear gradient background string based on a seed string.
 * @param seed A string (e.g., user ID or username) to base the gradient on.
 * @returns A CSS linear-gradient string.
 */
export function generateGradientBackground(seed: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }

  // Generate two hue values based on the hash
  const hue1 = Math.abs(hash % 360);
  const hue2 = Math.abs((hash >> 8) % 360); // Use different bits for the second hue

  // Use fixed saturation and lightness for consistency
  const saturation = 70;
  const lightness = 50;

  // Return CSS gradient string
  return `linear-gradient(135deg, hsl(${hue1}, ${saturation}%, ${lightness}%), hsl(${hue2}, ${saturation}%, ${lightness}%))`;
}

/**
 * Helper to get initials for Avatar fallback
 * @param name The full name or username string.
 * @returns A string with one or two initials, or '?'.
 */
export const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  const names = name.trim().split(" ");
  if (names.length === 1 && names[0] === "") return "?"; // Handle empty or whitespace-only names
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (
    names[0].charAt(0).toUpperCase() +
    names[names.length - 1].charAt(0).toUpperCase()
  );
};

// Add a 'success' variant style if needed, or map 'completed' to an existing one.
// For now, let's assume 'success' exists or map it to 'default' temporarily.
// If using Shadcn UI Badge, you might need to add a 'success' variant in globals.css or badge.tsx.
