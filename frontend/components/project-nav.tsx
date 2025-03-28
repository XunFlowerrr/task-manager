"use client";

import { ChevronRight, icons, type LucideIcon } from "lucide-react";
import { LayoutList } from "lucide-react";
import { UsersRound } from "lucide-react";
import { Settings } from "lucide-react";
import { House } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Project } from "@/lib/api/projects";

// Updated to use the Project type directly with optional icon and isActive
type ProjectWithUIState = Project & {
  icon?: LucideIcon;
  isActive?: boolean;
};

const subMenuItems = [
  {
    title: "Project Dashboard",
    icons: <House />,
  },
  {
    title: "Tasks",
    icons: <LayoutList />,
  },
  {
    title: "Members",
    icons: <UsersRound />,
  },
  {
    title: "Settings",
    icons: <Settings />,
  },
];

export function ProjectNav({ items }: { items: Project[] | undefined }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.project_id}
            asChild
            defaultOpen={false}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.project_name}>
                  {/* Using category as an optional filter for showing an icon */}
                  <span>{item.project_name}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {subMenuItems?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <div>
                          {subItem.icons}
                          <span>{subItem.title}</span>
                        </div>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
