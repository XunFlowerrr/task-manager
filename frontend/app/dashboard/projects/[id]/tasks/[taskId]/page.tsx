"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getTask,
  Task,
  Assignee,
  getTaskAssignees,
  deleteTask,
} from "@/lib/api/tasks";
import { getProject, Project } from "@/lib/api/projects";
import {
  getTaskAttachments,
  uploadAttachment,
  deleteAttachment,
  Attachment,
  getAttachmentDownloadUrl,
} from "@/lib/api/attachments";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  Paperclip,
  Download,
  Trash2,
  Upload,
  Info,
  CalendarDays,
  User,
  Tag,
  Loader2,
  FileText,
  MoreVertical,
  Edit,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  formatDate,
  formatPriority,
  getPriorityBadgeVariant,
  getStatusBadgeVariant,
} from "@/lib/utils";
import { AttachmentPreviewModal } from "@/components/ui/AttachmentPreviewModal";
import { EditTaskDialog } from "@/components/edit-task-dialog";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export default function TaskDetailPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const taskId = params.taskId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<string | null>(null);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.token && projectId && taskId) {
      fetchTaskData();
    } else if (!projectId || !taskId) {
      setError("Project ID or Task ID is missing.");
      setLoading(false);
    }
  }, [isAuthenticated, user, projectId, taskId, router]);

  const fetchTaskData = async () => {
    if (!user?.token) return;
    setLoading(true);
    setError(null);
    try {
      const [projectData, taskData, assigneesData, attachmentsData] =
        await Promise.all([
          getProject(projectId, user.token),
          getTask(taskId, user.token),
          getTaskAssignees(taskId, user.token),
          getTaskAttachments(taskId, user.token),
        ]);
      setProject(projectData);
      setTask(taskData);
      setAssignees(assigneesData);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error("Failed to fetch task data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load task details."
      );
      toast.error("Failed to load task details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentPreviewUrls: Record<string, string> = {};

    const generatePreviews = async () => {
      if (!user?.token) return;

      for (const att of attachments) {
        if (
          att.file_type.startsWith("image/") ||
          att.file_type.startsWith("video/")
        ) {
          try {
            const downloadUrl = getAttachmentDownloadUrl(att.attachment_id);
            const response = await fetch(downloadUrl, {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            });
            if (!response.ok) {
              throw new Error(`Failed to fetch file: ${response.statusText}`);
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            currentPreviewUrls[att.attachment_id] = objectUrl;
          } catch (fileError) {
            console.error(
              `Failed to load preview for ${att.file_name}:`,
              fileError
            );
          }
        }
      }
      setPreviewUrls(currentPreviewUrls);
    };

    generatePreviews();

    return () => {
      Object.values(currentPreviewUrls).forEach(URL.revokeObjectURL);
      Object.values(previewUrls).forEach(URL.revokeObjectURL);
    };
  }, [attachments, user?.token]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.token || !taskId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const result = await uploadAttachment(taskId, formData, user.token);
      setAttachments((prev) => [...prev, result.attachment]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(result.message || "Attachment uploaded successfully.");
    } catch (err) {
      console.error("Failed to upload attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload attachment."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!user?.token) return;
    try {
      await deleteAttachment(attachmentId, user.token);
      setAttachments((prev) =>
        prev.filter((att) => att.attachment_id !== attachmentId)
      );
      setPreviewUrls((prev) => {
        const newPreviews = { ...prev };
        if (newPreviews[attachmentId]) {
          URL.revokeObjectURL(newPreviews[attachmentId]);
          delete newPreviews[attachmentId];
        }
        return newPreviews;
      });
      toast.success("Attachment deleted successfully.");
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete attachment."
      );
    }
  };

  const getDownloadUrl = (attachmentId: string) => {
    return `${API_URL}/attachments/${attachmentId}/download?token=${user?.token}`;
  };

  const openPreviewModal = (
    fileUrl: string,
    fileName: string,
    fileType: string
  ) => {
    setPreviewFileUrl(fileUrl);
    setPreviewFileName(fileName);
    setPreviewFileType(fileType);
    setIsPreviewModalOpen(true);
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewFileUrl(null);
    setPreviewFileName(null);
    setPreviewFileType(null);
  };

  const handleEditTask = () => {
    if (task) {
      setEditTaskOpen(true);
    } else {
      toast.error("Task data not available for editing.");
    }
  };

  const handleDeleteTask = () => {
    setDeleteAlertOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!task || !user?.token) return;

    try {
      await deleteTask(task.task_id, user.token);
      toast.success("Task deleted successfully.");
      router.push(`/dashboard/projects/${projectId}`);
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error(
        `Failed to delete task: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setDeleteAlertOpen(false);
    }
  };

  const handleTaskUpdated = () => {
    fetchTaskData();
    setEditTaskOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading task details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <div className="bg-destructive/10 text-destructive rounded-md p-4 flex items-center max-w-md text-center">
          <Info className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
        <Button onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
          Back to Project
        </Button>
      </div>
    );
  }

  if (!task || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <div className="bg-muted/10 text-muted-foreground rounded-md p-4 flex items-center max-w-md text-center">
          <Info className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>Task or project data not found.</span>
        </div>
        <Button onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
          Back to Project
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
                  label: project.project_name,
                  link: `/dashboard/projects/${projectId}`,
                },
                {
                  label: "Tasks",
                  link: `/dashboard/projects/${projectId}/tasks`,
                },
                { label: task.task_name },
              ]}
            />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{task.task_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {task.task_description || "No description provided."}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditTask}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit Task</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteTask}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Task</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={getStatusBadgeVariant(task.status)}>
                    {task.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge variant={getPriorityBadgeVariant(task.priority)}>
                    {formatPriority(task.priority)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>{formatDate(task.start_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Due Date:</span>
                  <span>{formatDate(task.due_date)}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 md:col-span-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assignees:</span>
                  <div className="flex -space-x-2 overflow-hidden">
                    <TooltipProvider>
                      {assignees.length > 0 ? (
                        assignees.map((assignee) => (
                          <Tooltip key={assignee.user_id}>
                            <TooltipTrigger asChild>
                              <Avatar className="inline-block h-6 w-6 rounded-full ring-2 ring-background">
                                <AvatarImage
                                  src={`https://avatar.vercel.sh/${assignee.email}.png`}
                                  alt={assignee.username}
                                />
                                <AvatarFallback>
                                  {assignee.username?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {assignee.username} ({assignee.email})
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))
                      ) : (
                        <span>None</span>
                      )}
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Paperclip className="h-5 w-5" /> Attachments (
                  {attachments.length})
                </h3>
                <div className="space-y-3 mb-4">
                  {attachments.length > 0 ? (
                    attachments.map((att) => {
                      const canPreview =
                        att.file_type.startsWith("image/") ||
                        att.file_type.startsWith("video/");
                      const previewUrl = previewUrls[att.attachment_id];

                      return (
                        <div
                          key={att.attachment_id}
                          className="flex items-center justify-between p-2 border rounded-md bg-muted/30 hover:bg-muted/60"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {previewUrl && canPreview ? (
                              <button
                                onClick={() =>
                                  openPreviewModal(
                                    previewUrl,
                                    att.file_name,
                                    att.file_type
                                  )
                                }
                                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded flex-shrink-0"
                                aria-label={`Preview ${att.file_name}`}
                              >
                                {att.file_type.startsWith("image/") ? (
                                  <Image
                                    src={previewUrl}
                                    alt={`Preview of ${att.file_name}`}
                                    width={40}
                                    height={40}
                                    className="object-cover rounded aspect-square cursor-pointer"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center cursor-pointer">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="w-5 h-5 text-muted-foreground"
                                    >
                                      <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-15Zm10.94 6.19L8.395 14.445A.75.75 0 0 1 7.5 13.852V8.147a.75.75 0 0 1 1.14-.642l6.25 3.5a.75.75 0 0 1 0 1.284Z" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            ) : canPreview && !previewUrl ? (
                              <div className="flex items-center justify-center w-10 h-10 rounded bg-muted flex-shrink-0">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground ml-3 mr-1" />
                            )}
                            <span
                              className="text-sm font-medium truncate"
                              title={att.file_name}
                            >
                              {att.file_name}
                            </span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(att.file_size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" asChild>
                                    <a
                                      href={getDownloadUrl(att.attachment_id)}
                                      download={att.file_name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() =>
                                      handleDeleteAttachment(att.attachment_id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No attachments yet.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="flex-grow"
                    disabled={isUploading}
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload
                  </Button>
                </div>
                {selectedFile && !isUploading && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
      <AttachmentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={closePreviewModal}
        fileUrl={previewFileUrl}
        fileName={previewFileName}
        fileType={previewFileType}
      />
      {task && (
        <EditTaskDialog
          token={user?.token}
          task={task}
          open={editTaskOpen}
          onOpenChange={setEditTaskOpen}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task &quot;{task?.task_name}&quot; and remove its data from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTask}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ReduxSidebarProvider>
  );
}
