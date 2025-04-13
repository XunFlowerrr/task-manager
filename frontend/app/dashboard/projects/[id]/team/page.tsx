"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  getProjectMembers,
  removeProjectMember,
  ProjectMember,
} from "@/lib/api/projectMembers";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Trash2, MoreVertical } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import { BreadcrumbHelper } from "@/components/ui/breadcrumb-helper";
import { getProject, Project } from "@/lib/api/projects";
import { InviteMemberDialog } from "@/components/invite-member-dialog";

export default function ProjectTeamPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [removeAlertOpen, setRemoveAlertOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!user?.token || !projectId) return;
    try {
      setLoading(true);
      setError(null);
      const [projectData, membersData] = await Promise.all([
        getProject(projectId, user.token),
        getProjectMembers(projectId, user.token),
      ]);
      setProject(projectData);
      setMembers(membersData);
    } catch (err) {
      console.error("Failed to fetch project team data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred while fetching team data."
      );
      toast.error("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user?.token && projectId) {
      fetchData();
    }
  }, [isAuthenticated, router, user, projectId]);

  const handleRemoveMember = (userId: string) => {
    setRemovingMemberId(userId);
    setRemoveAlertOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!removingMemberId || !user?.token) return;

    if (removingMemberId === project?.owner_id) {
      toast.error("Project owner cannot be removed.");
      setRemovingMemberId(null);
      setRemoveAlertOpen(false);
      return;
    }

    if (removingMemberId === user?.id && user?.id !== project?.owner_id) {
      toast.error("You cannot remove yourself from the project.");
      setRemovingMemberId(null);
      setRemoveAlertOpen(false);
      return;
    }

    try {
      await removeProjectMember(projectId, removingMemberId, user.token);
      toast.success("Member removed successfully.");
      setMembers(
        members.filter((member) => member.user_id !== removingMemberId)
      );
    } catch (err) {
      console.error("Failed to remove member:", err);
      toast.error(
        `Failed to remove member: ${
          err instanceof Error ? err.message : "Please try again."
        }`
      );
    } finally {
      setRemovingMemberId(null);
      setRemoveAlertOpen(false);
    }
  };

  const handleMembersAdded = () => {
    toast.success("Member(s) added successfully.");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading team members...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push("/dashboard")}>
          Return to Dashboard
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
                { label: "Projects", link: "/dashboard" },
                {
                  label: project?.project_name || "Project",
                  link: `/dashboard/projects/${projectId}`,
                },
                { label: "Team" },
              ]}
            />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Project Team</h1>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite Member
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.username || "N/A"}
                        {member.user_id === project?.owner_id && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Owner)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{member.email || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        {member.user_id !== project?.owner_id &&
                          member.user_id !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                  <span className="sr-only">
                                    Member options
                                  </span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleRemoveMember(member.user_id)
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        {member.user_id === user?.id &&
                          member.user_id !== project?.owner_id && (
                            <span className="text-xs text-muted-foreground italic mr-2">
                              You
                            </span>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No members found for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>

      <AlertDialog open={removeAlertOpen} onOpenChange={setRemoveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the member from the project. They will
              lose access immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemovingMemberId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember}>
              Remove Member
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
