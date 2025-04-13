"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { debounce } from "lodash";
import { searchUsers, UserSearchResult } from "@/lib/api/users";
import { addProjectMember } from "@/lib/api/projectMembers";

interface InviteMemberDialogProps {
  projectId: string;
  token?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersAdded?: () => void;
}

export function InviteMemberDialog({
  projectId,
  token,
  open,
  onOpenChange,
  onMembersAdded,
}: InviteMemberDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [stagedUsers, setStagedUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchUsers(query, projectId, token);
        const stagedUserIds = new Set(stagedUsers.map((u) => u.user_id));
        setSearchResults(results.filter((u) => !stagedUserIds.has(u.user_id)));
      } catch (error) {
        console.error("Failed to search users:", error);
        toast.error(
          `Failed to search users: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [token, stagedUsers, projectId]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleAddUser = (user: UserSearchResult) => {
    if (!stagedUsers.some((u) => u.user_id === user.user_id)) {
      setStagedUsers([...stagedUsers, user]);
      setSearchResults(searchResults.filter((u) => u.user_id !== user.user_id));
    }
  };

  const handleRemoveUser = (userId: string) => {
    const userToRemove = stagedUsers.find((u) => u.user_id === userId);
    setStagedUsers(stagedUsers.filter((u) => u.user_id !== userId));
    if (
      userToRemove &&
      searchQuery &&
      (userToRemove.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
        userToRemove.email.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      if (!searchResults.some((u) => u.user_id === userToRemove.user_id)) {
        setSearchResults([...searchResults, userToRemove]);
      }
    }
  };

  const handleAddMembers = async () => {
    if (stagedUsers.length === 0 || !token) return;

    setIsAdding(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const addPromises = stagedUsers.map((user) =>
        addProjectMember(projectId, user.user_id, token)
          .then(() => {
            successCount++;
          })
          .catch((err) => {
            console.error(`Failed to add ${user.username}:`, err);
            errorCount++;
            const errorMessage = err.message?.includes("already a member")
              ? `${user.username} is already a member.`
              : `Failed to add ${user.username}: ${
                  err.message || "Unknown error"
                }`;
            toast.error(errorMessage);
          })
      );

      await Promise.all(addPromises);

      if (successCount > 0) {
        if (onMembersAdded) {
          onMembersAdded();
        }
        setSearchQuery("");
        setSearchResults([]);
        setStagedUsers([]);
        onOpenChange(false);
      }
    } catch (error) {
      console.error(
        "An unexpected error occurred during member addition:",
        error
      );
      toast.error("An unexpected error occurred while adding members.");
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setStagedUsers([]);
      setIsSearching(false);
      setIsAdding(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Team Members</DialogTitle>
          <DialogDescription>
            Search for users by username or email and add them directly to the
            project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Search username or email (min 1 char)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isAdding}
          />
          <div className="relative min-h-[150px]">
            {isSearching && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <ScrollArea className="h-[150px] w-full rounded-md border">
              <div className="p-2 space-y-1">
                {searchQuery && !isSearching && searchResults.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No users found matching "{searchQuery}".
                  </p>
                )}
                {searchResults.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
                  >
                    <div>
                      <p className="text-sm font-medium">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddUser(user)}
                      disabled={isAdding}
                      className="shrink-0"
                    >
                      <UserPlus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {stagedUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Selected Users:</h4>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
                {stagedUsers.map((user) => (
                  <Badge key={user.user_id} variant="secondary">
                    {user.username}
                    <button
                      onClick={() => handleRemoveUser(user.user_id)}
                      className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                      disabled={isAdding}
                      aria-label={`Remove ${user.username}`}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMembers}
            disabled={stagedUsers.length === 0 || isAdding || isSearching}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Add Members (
                {stagedUsers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
