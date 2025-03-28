import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import {
  selectSidebarOpen,
  selectSidebarState,
  selectMobileSidebarOpen,
  toggleSidebar,
  setSidebarOpen
} from '@/store/slices/sidebarSlice';
import { useIsMobile } from './use-mobile';

// This hook replaces the original useSidebar hook but uses Redux for state management
export function useSidebarRedux() {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const open = useAppSelector(selectSidebarOpen);
  const state = useAppSelector(selectSidebarState);
  const openMobile = useAppSelector(selectMobileSidebarOpen);

  const setOpen = useCallback((value: boolean | ((prevValue: boolean) => boolean)) => {
    if (typeof value === 'function') {
      // Need to manually handle function updates since we can't access previous state directly
      const newValue = value(open);
      dispatch(setSidebarOpen(newValue));
    } else {
      dispatch(setSidebarOpen(value));
    }
  }, [dispatch, open]);


  const toggleSidebarHandler = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  return {
    state,
    open,
    setOpen,
    toggleSidebar: toggleSidebarHandler
  };
}
