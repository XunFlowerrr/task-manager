"use client";

import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/store/store";
import {
  selectSidebarOpen,
  toggleSidebar,
  setSidebarOpen,
} from "@/store/slices/sidebarSlice";

/**
 * This component demonstrates accessing and controlling the sidebar state
 * from anywhere in your application using Redux.
 */
export function SidebarStateDisplay() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectSidebarOpen);

  return (
    <div className="p-4 border rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Sidebar Redux State</h3>
        <div className="px-2 py-1 bg-primary/10 rounded text-xs font-mono">
          {isOpen ? "expanded" : "collapsed"}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => dispatch(toggleSidebar())}
          size="sm"
        >
          Toggle Sidebar
        </Button>

        <Button
          variant="outline"
          onClick={() => dispatch(setSidebarOpen(true))}
          size="sm"
          disabled={isOpen}
        >
          Open Sidebar
        </Button>

        <Button
          variant="outline"
          onClick={() => dispatch(setSidebarOpen(false))}
          size="sm"
          disabled={!isOpen}
        >
          Close Sidebar
        </Button>
      </div>
    </div>
  );
}
