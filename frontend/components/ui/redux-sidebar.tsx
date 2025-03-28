"use client";

import React, { useEffect } from "react";
import { SidebarProvider as OriginalSidebarProvider } from "./sidebar";
import { useSidebarRedux } from "@/hooks/useSidebarRedux";
import { useAppDispatch } from "@/store/store";
import { setSidebarOpen } from "@/store/slices/sidebarSlice";

// This gets the initial sidebar state from cookie on client side
function getInitialSidebarState(): boolean {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(
      new RegExp("(^| )sidebar_state=([^;]+)")
    );
    if (match) {
      return match[2] === "true";
    }
  }
  return true; // default is open
}

// Redux-based SidebarProvider that can be used as a drop-in replacement
export function ReduxSidebarProvider({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<typeof OriginalSidebarProvider>) {
  const { open, setOpen } = useSidebarRedux();

  const dispatch = useAppDispatch();

  // Load initial state from cookie on component mount
  useEffect(() => {
    const initialState = getInitialSidebarState();
    dispatch(setSidebarOpen(initialState));
  }, [dispatch]);

  return (
    <OriginalSidebarProvider
      open={open}
      onOpenChange={setOpen}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </OriginalSidebarProvider>
  );
}
