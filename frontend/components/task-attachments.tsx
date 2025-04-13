"use client";

import React, { useState, useEffect } from "react";
import {
  Attachment,
  getTaskAttachments,
  createAttachment,
  deleteAttachment,
  CreateAttachmentData,
} from "@/lib/api/attachments";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Upload,
  FileText,
  Trash2,
  Download,
  Link as LinkIcon,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface TaskAttachmentsProps {
  taskId: string;
  token?: string;
}

export function TaskAttachments({ taskId, token }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for adding new attachment (simplified: using URL)
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // State for delete confirmation
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);

  const fetchAttachments = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTaskAttachments(taskId, token);
      setAttachments(data);
    } catch (err) {
      console.error("Failed to fetch attachments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load attachments"
      );
      toast.error("Failed to load attachments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [taskId, token]);

  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim() || !token) {
      toast.error("Attachment name and URL are required.");
      return;
    }

    // Basic URL validation (can be improved)
    try {
      new URL(newAttachmentUrl);
    } catch (_) {
      toast.error("Invalid URL format.");
      return;
    }

    setIsUploading(true);
    const attachmentData: CreateAttachmentData = {
      attachmentName: newAttachmentName.trim(),
      taskId: taskId,
      file_url: newAttachmentUrl.trim(),
      // Infer file type or set a default; for simplicity, using 'link'
      file_type: "link",
    };

    try {
      await createAttachment(attachmentData, token);
      toast.success("Attachment added successfully.");
      setNewAttachmentName("");
      setNewAttachmentUrl("");
      fetchAttachments(); // Refresh list
    } catch (err) {
      console.error("Failed to add attachment:", err);
      toast.error(
        `Failed to add attachment: ${
          err instanceof Error ? err.message : "Error"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAttachmentId || !token) return;

    try {
      await deleteAttachment(deletingAttachmentId, token);
      toast.success("Attachment deleted successfully.");
      fetchAttachments(); // Refresh list
    } catch (err) {
      console.error("Failed to delete attachment:", err);
      toast.error(
        `Failed to delete attachment: ${
          err instanceof Error ? err.message : "Error"
        }`
      );
    } finally {
      setDeletingAttachmentId(null);
      setDeleteAlertOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>
          Manage files and links attached to this task.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading attachments...</p>}
        {error && <p className="text-destructive">Error: {error}</p>}
        {!isLoading && !error && attachments.length === 0 && (
          <p className="text-muted-foreground text-sm">No attachments yet.</p>
        )}
        {!isLoading && !error && attachments.length > 0 && (
          <ul className="space-y-3">
            {attachments.map((att) => (
              <li
                key={att.attachment_id}
                className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <Link
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline"
                    >
                      {att.attachment_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Added: {formatDate(att.created_at, "PPp")} (
                      {att.file_type})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link
                      href={att.file_url}
                      target="_blank"
                      download={att.attachment_name}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(att.attachment_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleAddAttachment} className="w-full space-y-3">
          <p className="text-sm font-medium">Add New Attachment (Link)</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="attachmentName" className="sr-only">
                Attachment Name
              </Label>
              <Input
                id="attachmentName"
                placeholder="Attachment Name"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                disabled={isUploading}
                required
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="attachmentUrl" className="sr-only">
                Attachment URL
              </Label>
              <Input
                id="attachmentUrl"
                type="url"
                placeholder="https://example.com/file.pdf"
                value={newAttachmentUrl}
                onChange={(e) => setNewAttachmentUrl(e.target.value)}
                disabled={isUploading}
                required
              />
            </div>
            <Button type="submit" disabled={isUploading} className="sm:ml-2">
              {isUploading ? (
                "Adding..."
              ) : (
                <>
                  <LinkIcon className="mr-2 h-4 w-4" /> Add Link
                </>
              )}
            </Button>
          </div>
          {/* Basic file upload could go here later */}
          {/* <div className="flex items-center gap-2">
             <Input id="fileUpload" type="file" className="flex-1" />
             <Button type="button" variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload File</Button>
           </div> */}
        </form>
      </CardFooter>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              attachment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAttachmentId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
