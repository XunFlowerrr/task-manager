"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserTasks, Task } from "@/lib/api/tasks";
import { TaskList } from "@/components/task-list"; // Import the new component
import { toast } from "sonner";

export default function MyTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch user tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (user?.token) {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedTasks = await getUserTasks(user.token);
          // Note: getUserTasks already includes project_name in the backend query
          setTasks(fetchedTasks);
        } catch (err) {
          console.error("Failed to fetch user tasks:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load tasks";
          setError(errorMessage);
          toast.error("Failed to load your tasks.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated, user?.token]);

  // Show loading state while checking auth or fetching initial data
  if (!isAuthenticated || (isLoading && tasks.length === 0)) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading tasks...
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
            <BreadcrumbHelper routes={[{ label: "Dashboard", link: "/dashboard" }, { label: "My Tasks" }]} />
          </div>
          {/* Add Header actions if needed, e.g., User menu */}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold">My Tasks</h1>
            <p className="text-muted-foreground">All tasks assigned to you across projects.</p>
          </div>
          <TaskList
            tasks={tasks}
            isLoading={isLoading}
            error={error}
            title="My Tasks"
            showProjectColumn={true} // Show project name for user tasks
            // Pass edit/delete handlers if implementing actions directly here
            // onEditTask={handleEditTask}
            // onDeleteTask={handleDeleteTask}
          />
        </main>
      </SidebarInset>
    </ReduxSidebarProvider>
  );
}
