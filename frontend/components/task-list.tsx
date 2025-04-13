"use client";

import { Task, Assignee } from "@/lib/api/tasks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Info, Eye } from "lucide-react";
import {
  formatDate,
  formatPriority,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  title: string;
  showProjectColumn?: boolean;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  // Add onAssigneeClick or similar if needed later
}

// Helper to get initials for Avatar fallback
const getInitials = (name?: string): string => {
  if (!name) return "?";
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (
    names[0].charAt(0).toUpperCase() +
    names[names.length - 1].charAt(0).toUpperCase()
  );
};

export function TaskList({
  tasks,
  isLoading,
  error,
  title,
  showProjectColumn = false,
  onEditTask,
  onDeleteTask,
}: TaskListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-4 flex items-center">
        <Info className="w-5 h-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed rounded-lg">
        <Info className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No tasks found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          There are currently no tasks matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border shadow-sm bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              {showProjectColumn && <TableHead>Project</TableHead>}
              <TableHead>Due Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.task_id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/projects/${task.project_id}/tasks/${task.task_id}`}
                    className="hover:underline"
                  >
                    {task.task_name}
                  </Link>
                  {task.task_description && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {task.task_description}
                    </p>
                  )}
                </TableCell>
                {showProjectColumn && (
                  <TableCell>
                    <Link
                      href={`/dashboard/projects/${task.project_id}`}
                      className="hover:underline text-sm"
                    >
                      {/* Assuming project_name is available on Task for 'My Tasks' view */}
                      {(task as any).project_name || task.project_id}
                    </Link>
                  </TableCell>
                )}
                <TableCell>{formatDate(task.due_date, "PP")}</TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(task.priority)}>
                    {formatPriority(task.priority)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(task.status)}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {task.assignees?.slice(0, 3).map((assignee) => (
                      <Tooltip key={assignee.user_id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            {/* Add AvatarImage if you have URLs */}
                            <AvatarFallback>
                              {getInitials(assignee.username)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {assignee.username ||
                              assignee.email ||
                              assignee.user_id}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {task.assignees && task.assignees.length > 3 && (
                      <Avatar className="h-6 w-6 border-2 border-background">
                        <AvatarFallback>
                          +{task.assignees.length - 3}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!task.assignees ||
                      (task.assignees.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Task actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/projects/${task.project_id}/tasks/${task.task_id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      {onEditTask && (
                        <DropdownMenuItem
                          onClick={() => onEditTask(task.task_id)}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      )}
                      {onDeleteTask && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteTask(task.task_id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
