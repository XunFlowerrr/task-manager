"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAllProjectsClient, Project } from "@/lib/api/projects";
import { Folders } from "lucide-react";
import { getUserTasks, Task } from "@/lib/api/tasks";
import SummaryCard from "@/components/summary-card";
import { CalendarClock } from "lucide-react";
import { AlignLeft } from "lucide-react";

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>();
  const [tasks, setTasks] = useState<Task[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Only fetch data if authenticated and we have a token
    if (user?.token) {
      // Only fetch projects if authenticated
      const fetchProjects = async () => {
        try {
          const fetchedProjects = await getAllProjectsClient(user.token!);
          console.log(fetchedProjects);
          setProjects(fetchedProjects);
        } catch (error) {
          console.error("Failed to fetch projects:", error);
        }
      };

      const fetchTasks = async () => {
        try {
          // Use the client version with the token from user context
          const fetchedTasks = await getUserTasks(user.token!);
          console.log(fetchedTasks);
          setTasks(fetchedTasks);
        } catch (error) {
          console.error("Failed to fetch tasks:", error);
        }
      };

      fetchProjects();
      fetchTasks();
    }
  }, [isAuthenticated, router, user]);

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
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{user?.name || "User"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<CalendarClock />}
              label="Total today tasks"
              data={
                tasks.filter(
                  (task) =>
                    task.due_date === new Date().toISOString().split("T")[0]
                ).length || 0
              }
              onClick={{ url: "/tasks" }}
            />
            <SummaryCard
              icon={<AlignLeft />}
              label="Total pending tasks"
              data={tasks.length || 0}
              onClick={{ url: "/tasks" }}
            />
            <SummaryCard
              icon={<Folders />}
              label="Total Projects"
              data={projects?.length || 0}
              onClick={{ url: "/projects" }}
            />
          </div>
          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
        </div>
      </SidebarInset>
    </ReduxSidebarProvider>
  );
}
