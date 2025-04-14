"use client";

import * as React from "react";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import LogoSidebar from "./logo-sidebar";
import { ProjectNav } from "./project-nav";
import { useState } from "react";
import { getAllProjects, Project } from "@/lib/api/projects";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  LayoutDashboard,
  Plus,
  Settings,
  FileText,
  LayoutList,
} from "lucide-react";
import { CreateProjectDialog } from "./create-project-dialog";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch projects from the API
  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await getAllProjects(user?.token!);
        setProjects(response);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    if (user?.token) {
      fetchProjects();
    }
  }, [user]);

  // Handle project creation success
  const handleProjectCreated = async () => {
    if (user?.token) {
      try {
        const response = await getAllProjects(user.token);
        setProjects(response);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    }
  };

  // Format user data for NavUser component
  const userData = {
    id: user?.id || "default-id",
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.image || "",
  };

  // Main navigation items
  const mainNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      href: "/dashboard",
    },
    {
      title: "My Tasks",
      icon: <LayoutList className="h-4 w-4" />,
      href: "/dashboard/tasks",
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link href="/dashboard">
          <LogoSidebar />
        </Link>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Projects Section */}
        {projects && projects.length > 0 ? (
          <ProjectNav items={projects} />
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <CreateProjectDialog
                  token={user?.token}
                  onProjectCreated={handleProjectCreated}
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                  triggerButton={
                    <SidebarMenuButton tooltip="Create Project">
                      <Plus className="h-4 w-4" />
                      <span>Create Project</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
              <div className="px-2 py-3 text-xs text-muted-foreground">
                No projects yet. Create one to get started.
              </div>
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
