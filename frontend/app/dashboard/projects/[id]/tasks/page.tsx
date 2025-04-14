"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getAllTasks, Task, deleteTask } from "@/lib/api/tasks";
import { getProject, Project } from "@/lib/api/projects";
import { TaskList } from "@/components/task-list";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProjectTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch project details and tasks
  useEffect(() => {
    const fetchData = async () => {
      if (user?.token && projectId) {
        setIsLoading(true);
        setError(null);
        try {
          const [projectData, tasksData] = await Promise.all([
            getProject(projectId, user.token),
            getAllTasks(projectId, user.token),
          ]);
          setProject(projectData);
          setTasks(tasksData);
        } catch (err) {
          console.error("Failed to fetch project tasks:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load project data";
          setError(errorMessage);
          toast.error("Failed to load project tasks.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, user?.token, projectId]);

  // Determine current filter value from URL params
  const statusFilter = searchParams.get("status");
  const dueFilter = searchParams.get("due");
  let currentFilterValue = "all";
  if (statusFilter === "completed") {
    currentFilterValue = "completed";
  } else if (statusFilter === "in-progress") {
    currentFilterValue = "in-progress";
  } else if (statusFilter === "pending") {
    currentFilterValue = "pending";
  } else if (dueFilter === "soon") {
    currentFilterValue = "soon";
  }

  // Filter tasks based on URL query parameters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      let keep = true;

      // Status filter
      if (statusFilter) {
        if (statusFilter === "pending") {
          if (task.status !== "pending" && task.status !== "in-progress") {
            keep = false;
          }
        } else if (task.status !== statusFilter) {
          keep = false;
        }
      }

      // Due date filter
      if (dueFilter === "soon") {
        if (!task.due_date) {
          keep = false;
        } else {
          const dueDate = new Date(task.due_date);
          const today = new Date();
          const threeDaysFromNow = new Date(today);
          threeDaysFromNow.setDate(today.getDate() + 3);
          if (
            dueDate < new Date(today.setHours(0, 0, 0, 0)) ||
            dueDate > new Date(threeDaysFromNow.setHours(23, 59, 59, 999)) ||
            task.status === "completed"
          ) {
            keep = false;
          }
        }
      }

      return keep;
    });
  }, [tasks, searchParams]);

  // Generate filter description
  let filterDescription = `All tasks within the '${
    project?.project_name || ""
  }' project`;
  if (currentFilterValue === "completed") {
    filterDescription = "Showing: Completed Tasks";
  } else if (currentFilterValue === "in-progress") {
    filterDescription = "Showing: In-Progress Tasks";
  } else if (currentFilterValue === "pending") {
    filterDescription = "Showing: Pending Tasks";
  } else if (currentFilterValue === "soon") {
    filterDescription = "Showing: Tasks Due Soon (within 3 days)";
  }

  // Handler for changing the filter via Select
  const handleFilterChange = (value: string) => {
    let query = {};
    if (value === "soon") {
      query = { due: "soon" };
    } else if (value === "completed") {
      query = { status: "completed" };
    } else if (value === "in-progress") {
      query = { status: "in-progress" };
    } else if (value === "pending") {
      query = { status: "pending" };
    }

    const params = new URLSearchParams(query);
    router.push(`/dashboard/projects/${projectId}/tasks?${params.toString()}`);
  };

  const refreshTasks = async () => {
    if (user?.token) {
      try {
        const tasksData = await getAllTasks(projectId, user.token);
        setTasks(tasksData);
      } catch (error) {
        console.error("Failed to refresh tasks:", error);
        toast.error("Failed to refresh task list.");
      }
    }
  };

  const handleTaskCreated = () => {
    refreshTasks();
    setCreateTaskOpen(false);
    toast.success("Task created successfully!");
  };

  const handleTaskUpdated = () => {
    refreshTasks();
    setEditTaskOpen(false);
    setEditingTask(null);
    toast.success("Task updated successfully!");
  };

  const handleEditTaskClick = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.task_id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setEditTaskOpen(true);
    } else {
      toast.error("Could not find the task to edit.");
    }
  };

  const handleDeleteTaskClick = (taskId: string) => {
    setDeletingTaskId(taskId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTaskId || !user?.token) return;

    try {
      await deleteTask(deletingTaskId, user.token);
      toast.success("Task deleted successfully.");
      refreshTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error(
        `Failed to delete task: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setDeletingTaskId(null);
      setDeleteAlertOpen(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading project tasks...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <p className="text-destructive text-center">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <ReduxSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <BreadcrumbHelper
              routes={[
                { label: "Dashboard", link: "/dashboard" },
                { label: "Projects", link: "/dashboard/projects" },
                {
                  label: project?.project_name || projectId,
                  link: `/dashboard/projects/${projectId}`,
                },
                { label: "Tasks" },
              ]}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">Project Tasks</h1>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <Filter className="h-3 w-3" /> {filterDescription}
              </p>
            </div>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <Select
                value={currentFilterValue}
                onValueChange={handleFilterChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter tasks..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="soon">Due Soon</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <CreateTaskDialog
                projectId={projectId}
                token={user?.token}
                onTaskCreated={handleTaskCreated}
                open={createTaskOpen}
                onOpenChange={setCreateTaskOpen}
                triggerButton={
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </Button>
                }
              />
            </div>
          </div>
          <TaskList
            tasks={filteredTasks}
            isLoading={isLoading}
            error={null}
            title="Project Tasks"
            showProjectColumn={false}
            onEditTask={handleEditTaskClick}
            onDeleteTask={handleDeleteTaskClick}
          />
        </main>
      </SidebarInset>

      <EditTaskDialog
        token={user?.token}
        task={editingTask}
        open={editTaskOpen}
        onOpenChange={setEditTaskOpen}
        onTaskUpdated={handleTaskUpdated}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTaskId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ReduxSidebarProvider>
  );
}
