"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateTask, Task, UpdateTaskData } from "@/lib/api/tasks";
import { getProjectMembers, ProjectMember } from "@/lib/api/projectMembers";
import { CalendarIcon, Check, ChevronsUpDown, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface EditTaskDialogProps {
  token?: string;
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: () => void;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const priorityOptions = [
  { value: "1", label: "Low" },
  { value: "2", label: "Medium" },
  { value: "3", label: "High" },
];

export function EditTaskDialog({
  token,
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: EditTaskDialogProps) {
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [priority, setPriority] = useState("2");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);

  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(
    new Set()
  );
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    if (task) {
      setTaskName(task.task_name || "");
      setTaskDescription(task.task_description || "");
      setStatus(task.status || "pending");
      setPriority(task.priority?.toString() || "2");
      try {
        setStartDate(task.start_date ? parseISO(task.start_date) : undefined);
      } catch {
        setStartDate(undefined);
      }
      try {
        setDueDate(task.due_date ? parseISO(task.due_date) : undefined);
      } catch {
        setDueDate(undefined);
      }
      setSelectedAssignees(
        new Set(task.assignees?.map((a) => a.user_id) || [])
      );
    } else {
      resetForm();
    }
  }, [task, open]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (open && task?.project_id && token) {
        setLoadingMembers(true);
        try {
          const fetchedMembers = await getProjectMembers(
            task.project_id,
            token
          );
          setMembers(fetchedMembers);
        } catch (error) {
          console.error("Failed to fetch project members:", error);
          toast.error("Could not load project members for assignment.");
          setMembers([]);
        } finally {
          setLoadingMembers(false);
        }
      } else {
        setMembers([]);
      }
    };

    fetchMembers();
  }, [open, task?.project_id, token]);

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!task) {
      toast.error("No task selected for editing.");
      return;
    }
    if (!taskName.trim()) {
      toast.error("Task name is required");
      return;
    }

    setIsUpdating(true);

    try {
      const updatedData: UpdateTaskData = {
        taskName: taskName.trim(),
        taskDescription: taskDescription.trim() || null,
        status: status as Task["status"],
        priority: parseInt(priority),
        startDate: startDate ? startDate.toISOString().split("T")[0] : null,
        dueDate: dueDate ? dueDate.toISOString().split("T")[0] : null,
        assignees: Array.from(selectedAssignees),
      };

      await updateTask(task.task_id, updatedData, token);

      toast.success("Task updated successfully");

      onOpenChange(false);

      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error(
        `Failed to update task: ${
          error instanceof Error ? error.message : "Please try again."
        }`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setTaskName("");
    setTaskDescription("");
    setStatus("pending");
    setPriority("2");
    setStartDate(undefined);
    setDueDate(undefined);
    setSelectedAssignees(new Set());
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

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleUpdateTask}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the details for this task.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-assignees" className="text-right">
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
                        {member.username || member.email}
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
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <div className="col-span-3">
                <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-status"
                      variant="outline"
                      role="combobox"
                      aria-expanded={statusOpen}
                      className="w-full justify-between"
                    >
                      {status
                        ? statusOptions.find(
                            (option) => option.value === status
                          )?.label
                        : "Select status..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search status..." />
                      <CommandList>
                        <CommandEmpty>No status found.</CommandEmpty>
                        <CommandGroup>
                          {statusOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                setStatus(currentValue);
                                setStatusOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  status === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-priority" className="text-right">
                Priority
              </Label>
              <div className="col-span-3">
                <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-priority"
                      variant="outline"
                      role="combobox"
                      aria-expanded={priorityOpen}
                      className="w-full justify-between"
                    >
                      {priority
                        ? priorityOptions.find(
                            (option) => option.value === priority
                          )?.label
                        : "Select priority..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search priority..." />
                      <CommandList>
                        <CommandEmpty>No priority found.</CommandEmpty>
                        <CommandGroup>
                          {priorityOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={(currentValue) => {
                                setPriority(currentValue);
                                setPriorityOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  priority === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-startDate" className="text-right">
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
                      id="edit-startDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
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
                        setStartDateOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => (dueDate ? date > dueDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-dueDate" className="text-right">
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
                      id="edit-dueDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
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
                        setDueDateOpen(false);
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
