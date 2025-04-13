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
import { getAllTasks, Task } from "@/lib/api/tasks";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectDashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only fetch data if authenticated and we have a token
    if (user?.token) {
      const fetchProjectData = async () => {
        try {
          setLoading(true);

          // Fetch project details
          const projectData = await getProject(projectId, user.token);
          console.log("Project Data Dash:", projectData);
          setProject(projectData);

          // Fetch project tasks
          const tasksData = await getAllTasks(projectId, user.token);
          setTasks(tasksData);

          setLoading(false);
        } catch (error) {
          console.error("Failed to fetch project data:", error);
          setError("Failed to load project data. Please try again later.");
          setLoading(false);
        }
      };

      fetchProjectData();
    }
  }, [isAuthenticated, router, user, projectId]);

  // If not authenticated, show minimal UI while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking authentication...
      </div>
    );
  }

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading project data...
      </div>
    );
  }

  // If error, show error state
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

  // Calculate task statistics
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

  // Format dates properly with validation
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";

    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Unknown";
      }
      return date.toLocaleDateString();
    } catch (e) {
      return "Unknown";
    }
  };

  // Use the correct property names from backend response
  const createdDate = formatDate(project?.created_date);
  const updatedDate = formatDate(project?.updated_date);

  // Project members count (using a placeholder value for now)
  const teamMembersCount = 0; // This would ideally be fetched from API

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/projects/${projectId}/tasks/new`}>
                    <Plus className="mr-2 h-4 w-4" /> Add Task
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/projects/${projectId}/team/invite`}>
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Team Member
                  </Link>
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
              {/* Recent Activity Panel */}
              <div className="bg-card text-card-foreground p-4 rounded-xl shadow-sm">
                <h2 className="text-lg font-medium mb-4">Recent Tasks</h2>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.task_id}
                      className="flex items-start justify-between p-2 hover:bg-muted/50 rounded-md"
                    >
                      <div>
                        <div className="font-medium">{task.task_name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {task.task_description || "No description"}
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : task.status === "in-progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {task.status}
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

              {/* Project Info Panel */}
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
                  {/* Project progress bar */}
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
    </ReduxSidebarProvider>
  );
}
