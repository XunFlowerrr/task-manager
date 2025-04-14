"use client";

import React from "react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import Image from "next/image";
import { useTheme } from "next-themes"; // Import useTheme

const LogoSidebar = () => {
  const { resolvedTheme } = useTheme(); // Get the resolved theme

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="hover:scale-[103%] hover:cursor-pointer bg-violet-400 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold group-data-[state=expanded]:hidden transition-all duration-200 ease-in-out">
            T
          </div>
          <div className="w-full flex items-center justify-center p-4">
            <Image
              // Conditionally set the src based on the theme
              src={
                resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png"
              }
              alt="Logo"
              objectFit="cover"
              width="100"
              height="100"
            />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default LogoSidebar;
