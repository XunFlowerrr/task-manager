"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useParams } from "next/navigation";
import { getProject, updateProject, deleteProject } from "@/lib/api/projects";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export default function ProjectSettings() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // Form state
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [category, setCategory] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load project data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.token) {
      const fetchProjectData = async () => {
        try {
          setLoading(true);
          setError(null);

          const projectData = await getProject(projectId, user.token);

          // Set form state with project data
          setProjectName(projectData.project_name);
          setProjectDescription(projectData.project_description || "");
          setCategory(projectData.category || "");

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await updateProject(
        projectId,
        {
          projectName: projectName.trim(),
          projectDescription: projectDescription.trim(),
          category: category.trim() || "General",
        },
        user?.token
      );

      toast.success("Project updated successfully");
      setIsSaving(false);
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project. Please try again.");
      setIsSaving(false);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true);

      await deleteProject(projectId, user?.token);

      toast.success("Project deleted successfully");
      setIsDeleting(false);
      setShowDeleteDialog(false);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
      setIsDeleting(false);
    }
  };

  // Loading and error states
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        Checking authentication...
      </div>
    );
  }

  if (loading) {
    return (
      <ReduxSidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <BreadcrumbHelper
              routes={[
                { label: "Dashboard", link: "/dashboard" },
                { label: "Project" },
                { label: "Settings" },
              ]}
            />
          </header>
          <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-muted-foreground">
              Loading project settings...
            </span>
          </div>
        </SidebarInset>
      </ReduxSidebarProvider>
    );
  }

  if (error) {
    return (
      <ReduxSidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <BreadcrumbHelper
              routes={[
                { label: "Dashboard", link: "/dashboard" },
                { label: "Project" },
                { label: "Settings" },
              ]}
            />
          </header>
          <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
            <div className="bg-destructive/10 text-destructive rounded-md p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <Button
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            >
              Return to Project
            </Button>
          </div>
        </SidebarInset>
      </ReduxSidebarProvider>
    );
  }

  return (
    <ReduxSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <BreadcrumbHelper
            routes={[
              { label: "Dashboard", link: "/dashboard" },
              {
                label: projectName || "Project",
                link: `/dashboard/projects/${projectId}`,
              },
              { label: "Settings" },
            ]}
          />
        </header>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild className="h-8 w-8">
                <Link href={`/dashboard/projects/${projectId}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Project Settings</h1>
            </div>
          </div>

          <div className="w-full">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4">Project Details</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Update your project information and settings
                </p>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="projectName"
                      className="text-sm font-medium"
                    >
                      Project Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="projectName"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Enter project name"
                      className="h-10 max-w-lg"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="projectDescription"
                      className="text-sm font-medium"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="projectDescription"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Enter project description"
                      rows={4}
                      className="min-h-[100px] resize-y max-w-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category
                    </Label>
                    <Input
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Enter project category"
                      className="h-10 max-w-lg"
                    />
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isSaving || isDeleting}
                  className="h-9"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || isDeleting}
                  className="h-9"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone and all tasks associated with this project will be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
              className="mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ReduxSidebarProvider>
  );
}
