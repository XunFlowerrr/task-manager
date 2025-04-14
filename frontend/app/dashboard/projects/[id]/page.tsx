"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProject, Project } from "@/lib/api/projects";
import { getAllTasks, Task, deleteTask } from "@/lib/api/tasks";
import { getProjectMembers, ProjectMember } from "@/lib/api/projectMembers";
import SummaryCard from "@/components/summary-card";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Users,
  Settings,
  MoreHorizontal,
  Plus,
  UserPlus,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Info, // Added Info icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { InviteMemberDialog } from "@/components/invite-member-dialog";

export default function ProjectDashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.token) {
      const fetchProjectData = async () => {
        try {
          setLoading(true);
          setError(null);

          const [projectData, tasksData, membersData] = await Promise.all([
            getProject(projectId, user.token),
            getAllTasks(projectId, user.token),
            getProjectMembers(projectId, user.token),
          ]);

          console.log("Project Data Dash:", projectData);
          setProject(projectData);
          setTasks(tasksData);
          setTeamMembers(membersData);

          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch project data:", error);
          let errorMessage =
            "An unexpected error occurred. Please try again later.";
          if (error instanceof Error) {
            errorMessage = error.message;
            if (
              error.name === "SyntaxError" &&
              error.message.includes("JSON")
            ) {
              errorMessage = `Received invalid data from the server. ${error.message}`;
              console.error("Response body likely not JSON.");
            } else {
              errorMessage = `Failed to load project data: ${error.message}`;
            }
          }
          setError(errorMessage);
          setLoading(false);
        }
      };

      fetchProjectData();
    }
  }, []);

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
  };

  const handleTaskUpdated = () => {
    refreshTasks();
    setEditingTask(null);
  };

  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.task_id === taskId);
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setEditTaskOpen(true);
    } else {
      toast.error("Could not find the task to edit.");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTaskId(taskId);
    setDeleteAlertOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!deletingTaskId) return;

    try {
      await deleteTask(deletingTaskId, user?.token);
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

  const handleMembersAdded = () => {
    toast.success("Member(s) added successfully.");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking authentication...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading project data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => router.push("/dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress"
  ).length;
  const pendingTasks = tasks.filter((task) => task.status === "pending").length;
  const dueSoonTasks = tasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0 && task.status !== "completed";
  }).length;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Unknown";
      }
      return date.toLocaleDateString();
    } catch (e) {
      return "Unknown";
    }
  };

  const createdDate = formatDate(project?.created_date);
  const updatedDate = formatDate(project?.updated_date);

  const teamMembersCount = teamMembers.length;

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
                { label: project?.project_name || "Project" },
              ]}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{project?.project_name}</h1>
              <p className="text-muted-foreground">
                {project?.project_description || "No description"}
              </p>
            </div>
            <div className="flex gap-2">
              <CreateTaskDialog
                projectId={projectId}
                token={user?.token}
                onTaskCreated={handleTaskCreated}
                open={createTaskOpen}
                onOpenChange={setCreateTaskOpen}
                triggerButton={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </Button>
                }
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setCreateTaskOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Team Member
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/projects/${projectId}/export`}>
                      <Download className="mr-2 h-4 w-4" /> Export Project
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/projects/${projectId}/settings`}>
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid auto-rows-min gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <SummaryCard
              icon={<ClipboardList />}
              label="Total Tasks"
              data={totalTasks}
              onClick={{ url: `/dashboard/projects/${projectId}/tasks` }}
            />
            <SummaryCard
              icon={<CheckCircle2 />}
              label="Completed"
              data={completedTasks}
              onClick={{
                url: `/dashboard/projects/${projectId}/tasks?status=completed`,
              }}
            />
            <SummaryCard
              icon={<Clock />}
              label="In Progress"
              data={inProgressTasks}
              onClick={{
                url: `/dashboard/projects/${projectId}/tasks?status=in-progress`,
              }}
            />
            <SummaryCard
              icon={<CalendarClock />}
              label="Due Soon"
              data={dueSoonTasks}
              onClick={{
                url: `/dashboard/projects/${projectId}/tasks?due=soon`,
              }}
            />
            <SummaryCard
              icon={<Users />}
              label="Team"
              data={teamMembersCount}
              onClick={{ url: `/dashboard/projects/${projectId}/team` }}
            />
          </div>

          <div className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Recent Tasks</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateTaskOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group"
                    >
                      <Link
                        href={`/dashboard/projects/${projectId}/tasks/${task.task_id}`}
                        className="flex-1 min-w-0"
                      >
                        <div className="font-medium truncate">
                          {task.task_name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {task.task_description || "No description"}
                        </div>
                      </Link>
                      <div className="flex items-center ml-2">
                        <div
                          className={`px-2 py-1 text-xs rounded-full mr-2 ${
                            task.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {task.status}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Task options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/projects/${projectId}/tasks/${task.task_id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View Details</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditTask(task.task_id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.task_id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center p-4 text-muted-foreground">
                      No tasks found for this project
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-medium mb-4">Project Details</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Category
                    </div>
                    <div>{project?.category || "Uncategorized"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Created</div>
                    <div>{createdDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Last Updated
                    </div>
                    <div>{updatedDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Progress
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width:
                            totalTasks > 0
                              ? `${Math.round(
                                  (completedTasks / totalTasks) * 100
                                )}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-right mt-1">
                      {totalTasks > 0
                        ? `${Math.round((completedTasks / totalTasks) * 100)}%`
                        : "0%"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      <InviteMemberDialog
        projectId={projectId}
        token={user?.token}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onMembersAdded={handleMembersAdded}
      />
    </ReduxSidebarProvider>
  );
}
