"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { createTask, CreateTaskData } from "@/lib/api/tasks";
import { getProjectMembers, ProjectMember } from "@/lib/api/projectMembers";
import {
  Plus,
  CalendarIcon,
  Check,
  ChevronsUpDown,
  ChevronDown,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, generateGradientBackground } from "@/lib/utils";

interface CreateTaskDialogProps {
  token?: string;
  projectId: string;
  triggerButton?: React.ReactNode;
  onTaskCreated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateTaskDialog({
  token,
  projectId,
  triggerButton,
  onTaskCreated,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateTaskDialogProps) {
  // State for uncontrolled dialog
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  // Form state
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState<number>(2); // Default to medium priority
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);

  // State for date picker popovers
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // State for members and assignees
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(
    new Set()
  );
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled =
    controlledOpen !== undefined && setControlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (value: boolean) => {
    if (isControlled) {
      setControlledOpen(value);
    } else {
      setUncontrolledOpen(value);
    }
    if (!value) {
      // Reset form when closing
      resetForm();
    }
  };

  // Fetch project members when the dialog opens or projectId/token changes
  useEffect(() => {
    const fetchMembers = async () => {
      if (open && projectId && token) {
        setLoadingMembers(true);
        try {
          const fetchedMembers = await getProjectMembers(projectId, token);
          setMembers(fetchedMembers);
        } catch (error) {
          console.error("Failed to fetch project members:", error);
          toast.error("Could not load project members for assignment.");
          setMembers([]); // Clear members on error
        } finally {
          setLoadingMembers(false);
        }
      } else {
        // Clear members if dialog is closed or no projectId/token
        setMembers([]);
      }
    };

    fetchMembers();
  }, [open, projectId, token]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      toast.error("Task name is required");
      return;
    }

    setIsCreating(true);

    try {
      const taskData: CreateTaskData = {
        projectId,
        taskName: taskName.trim(),
        taskDescription: taskDescription.trim() || undefined,
        status,
        priority,
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        dueDate: dueDate ? dueDate.toISOString().split("T")[0] : undefined,
        assignees: Array.from(selectedAssignees),
      };

      await createTask(taskData, token);

      toast.success("Task created successfully");

      // Reset form
      resetForm();

      // Close dialog
      setOpen(false);

      // Notify parent
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setTaskName("");
    setTaskDescription("");
    setStatus("pending");
    setPriority(2);
    setStartDate(undefined);
    setDueDate(undefined);
    setSelectedAssignees(new Set());
    setStartDateOpen(false); // Reset popover state
    setDueDateOpen(false); // Reset popover state
  };

  const handleAssigneeSelect = (userId: string) => {
    setSelectedAssignees((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const getAssigneeButtonLabel = () => {
    if (selectedAssignees.size === 0) return "Select Assignees";
    if (selectedAssignees.size === 1) {
      const assigneeId = Array.from(selectedAssignees)[0];
      const member = members.find((m) => m.user_id === assigneeId);
      return member?.username || `1 selected`;
    }
    return `${selectedAssignees.size} selected`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleCreateTask}>
          <DialogHeader>
            <DialogTitle>Create new task</DialogTitle>
            <DialogDescription>
              Add a new task to your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignees" className="text-right">
                Assignees
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="col-span-3 justify-between"
                    disabled={loadingMembers || members.length === 0}
                  >
                    <span>
                      {loadingMembers ? "Loading..." : getAssigneeButtonLabel()}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  <DropdownMenuLabel>Project Members</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {members.length > 0 ? (
                    members.map((member) => (
                      <DropdownMenuCheckboxItem
                        key={member.user_id}
                        checked={selectedAssignees.has(member.user_id)}
                        onCheckedChange={() =>
                          handleAssigneeSelect(member.user_id)
                        }
                        onSelect={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback
                              style={{
                                background: generateGradientBackground(
                                  member.username || member.user_id
                                ),
                                color: "white",
                                fontSize: "0.7rem",
                              }}
                            >
                              {getInitials(member.username)}
                            </AvatarFallback>
                          </Avatar>
                          {member.username || member.email}
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))
                  ) : (
                    <DropdownMenuCheckboxItem disabled>
                      No members found
                    </DropdownMenuCheckboxItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <div className="col-span-3">
                <Select
                  value={String(priority)}
                  onValueChange={(value) => setPriority(Number(value))}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Low</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Start Date
              </Label>
              <div className="col-span-3">
                <Popover
                  modal={true}
                  open={startDateOpen}
                  onOpenChange={setStartDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="startDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      onClick={() => setStartDateOpen(true)} // Open popover on click
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false); // Close popover on select
                      }}
                      initialFocus
                      disabled={(date) => (dueDate ? date > dueDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dueDate" className="text-right">
                Due Date
              </Label>
              <div className="col-span-3">
                <Popover
                  modal={true}
                  open={dueDateOpen}
                  onOpenChange={setDueDateOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                      onClick={() => setDueDateOpen(true)} // Open popover on click
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? (
                        format(dueDate, "PPP")
                      ) : (
                        <span>Pick a due date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => {
                        setDueDate(date);
                        setDueDateOpen(false); // Close popover on select
                      }}
                      initialFocus
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
