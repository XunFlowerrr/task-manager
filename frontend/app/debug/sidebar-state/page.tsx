import { SidebarStateDisplay } from "@/components/sidebar-state-display";
import { ReduxSidebarProvider } from "@/components/ui/redux-sidebar";
import React from "react";

function Page() {
  return (
    <ReduxSidebarProvider>
      <div className="bg-muted/50 aspect-video rounded-xl p-4 flex items-center justify-center">
        <SidebarStateDisplay />
      </div>
    </ReduxSidebarProvider>
  );
}

export default Page;
