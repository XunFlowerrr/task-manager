"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { getUserTasks, Task } from "@/lib/api/tasks";
import { TaskList } from "@/components/task-list";
import { toast } from "sonner";
import { getTodayDateString } from "@/lib/utils";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MyTasksPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Determine current filter value from URL params
  const statusFilter = searchParams.get("status");
  const dueFilter = searchParams.get("due");
  let currentFilterValue = "all";
  if (statusFilter === "pending") {
    currentFilterValue = "pending";
  } else if (statusFilter === "overdue") {
    currentFilterValue = "overdue";
  } else if (dueFilter === "today") {
    currentFilterValue = "today";
  }

  // Filter tasks based on URL query parameters
  const filteredTasks = useMemo(() => {
    const todayDateString = getTodayDateString();

    return tasks.filter((task) => {
      let keep = true;

      // Status filter ('pending' includes 'in-progress', 'overdue' checks date)
      if (statusFilter) {
        if (statusFilter === "pending") {
          if (task.status !== "pending" && task.status !== "in-progress") {
            keep = false;
          }
        } else if (statusFilter === "overdue") {
          if (
            task.status === "completed" ||
            !task.due_date ||
            new Date(task.due_date) >= new Date(new Date().setHours(0, 0, 0, 0))
          ) {
            keep = false;
          }
        } else if (task.status !== statusFilter) {
          keep = false;
        }
      }

      // Due date filter
      if (dueFilter === "today") {
        if (
          task.due_date?.split("T")[0] !== todayDateString ||
          task.status === "completed"
        ) {
          keep = false;
        }
      }

      return keep;
    });
  }, [tasks, searchParams]);

  // Generate filter description
  let filterDescription = "All assigned tasks";
  if (currentFilterValue === "pending") {
    filterDescription = "Pending & In-Progress Tasks";
  } else if (currentFilterValue === "overdue") {
    filterDescription = "Overdue Tasks";
  } else if (currentFilterValue === "today") {
    filterDescription = "Tasks Due Today";
  }

  // Handler for changing the filter via Select
  const handleFilterChange = (value: string) => {
    let query = {};
    if (value === "today") {
      query = { due: "today" };
    } else if (value === "pending") {
      query = { status: "pending" };
    } else if (value === "overdue") {
      query = { status: "overdue" };
    }

    const params = new URLSearchParams(query);
    router.push(`/dashboard/tasks?${params.toString()}`);
  };

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
            <BreadcrumbHelper
              routes={[
                { label: "Dashboard", link: "/dashboard" },
                { label: "My Tasks" },
              ]}
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">My Tasks</h1>
              <p className="text-muted-foreground flex items-center gap-1 text-sm">
                <Filter className="h-3 w-3" /> {filterDescription}
              </p>
            </div>
            <div className="w-full md:w-auto">
              <Select
                value={currentFilterValue}
                onValueChange={handleFilterChange}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter tasks..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  <SelectItem value="today">Due Today</SelectItem>
                  <SelectItem value="pending">Pending & In-Progress</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <TaskList
            tasks={filteredTasks}
            isLoading={isLoading && tasks.length === 0}
            error={error}
            title="My Tasks"
            showProjectColumn={true}
          />
        </main>
      </SidebarInset>
    </ReduxSidebarProvider>
  );
}
