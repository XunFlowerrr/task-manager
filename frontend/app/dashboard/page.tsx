"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllProjectsClient, Project } from "@/lib/api/projects";
import { Folders, Info, Plus, AlertTriangle } from "lucide-react";
import { getUserTasks, Task } from "@/lib/api/tasks";
import SummaryCard from "@/components/summary-card";
import { CalendarClock } from "lucide-react";
import { AlignLeft } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { getTodayDateString } from "@/lib/utils";

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only fetch data if authenticated and we have a token
    if (user?.token) {
      fetchProjects();
      fetchTasks();
    }
  }, [isAuthenticated, user, router]);

  const fetchProjects = async () => {
    if (!user?.token) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedProjects = await getAllProjectsClient(user.token!);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError("Failed to fetch projects. Please try again later.");
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!user?.token) return;

    try {
      const fetchedTasks = await getUserTasks(user.token!);
      setTasks(fetchedTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  // Filter projects for uniqueness *before* pagination
  const uniqueProjects = projects.filter(
    (project, index, self) =>
      index === self.findIndex((p) => p.project_id === project.project_id)
  );

  // Client-side pagination logic using unique projects
  const totalPages = Math.ceil(uniqueProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProjects = uniqueProjects.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleProjectCreated = () => {
    fetchProjects();
    toast.success("Project created successfully!");
  };

  // Calculate summary counts
  const totalProjects = uniqueProjects.length;
  const todayDateString = getTodayDateString();

  const todayTasksCount = tasks.filter(
    (task) =>
      task.due_date?.split("T")[0] === todayDateString &&
      task.status !== "completed"
  ).length;

  const pendingTasksCount = tasks.filter(
    (task) => task.status === "pending" || task.status === "in-progress"
  ).length;

  const overdueTasksCount = tasks.filter(
    (task) =>
      task.due_date &&
      new Date(task.due_date) < new Date() &&
      task.status !== "completed"
  ).length;

  // If not authenticated, show minimal UI while redirecting
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking authentication...
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
            <BreadcrumbHelper routes={[{ label: "Dashboard" }]} />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={<CalendarClock />}
              label="Due Today"
              data={todayTasksCount}
              onClick={{ url: "/dashboard/tasks?due=today" }}
            />
            <SummaryCard
              icon={<AlignLeft />}
              label="Pending Tasks"
              data={pendingTasksCount}
              onClick={{ url: "/dashboard/tasks?status=pending" }}
            />
            <SummaryCard
              icon={<AlertTriangle />}
              label="Overdue Tasks"
              data={overdueTasksCount}
              onClick={{ url: "/dashboard/tasks?status=overdue" }}
              variant="destructive"
            />
            <SummaryCard
              icon={<Folders />}
              label="Total Projects"
              data={totalProjects || 0}
              onClick={{ url: "/dashboard" }}
            />
          </div>

          <div className="bg-muted/50 p-4 flex-1 rounded-xl md:min-h-min flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Projects</h2>
              <CreateProjectDialog
                token={user?.token}
                onProjectCreated={handleProjectCreated}
                open={createProjectOpen}
                onOpenChange={setCreateProjectOpen}
                triggerButton={
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> New Project
                  </Button>
                }
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Loading projects...</span>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive rounded-md p-4 flex items-center">
                <Info className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            ) : uniqueProjects.length === 0 ? (
              <div className="bg-muted p-8 rounded-md text-center">
                <Folders className="w-10 h-10 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No projects found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't created any projects yet.
                </p>
                <CreateProjectDialog
                  token={user?.token}
                  onProjectCreated={handleProjectCreated}
                  open={createProjectOpen}
                  onOpenChange={setCreateProjectOpen}
                  triggerButton={
                    <Button className="mt-4">
                      <Plus className="mr-2 h-4 w-4" /> Create a project
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {currentProjects.map((project) => (
                    <Link
                      href={`/dashboard/projects/${project.project_id}`}
                      key={project.project_id}
                      className="block p-4 bg-background hover:bg-accent/50 rounded-md shadow-sm border transition-colors"
                    >
                      <h3 className="text-lg font-bold">
                        {project.project_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.project_description ||
                          "No description available."}
                      </p>
                      {project.progress !== undefined && (
                        <div className="mt-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 text-right">
                            {project.progress}% complete
                          </p>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </ReduxSidebarProvider>
  );
}
