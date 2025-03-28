import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define the sidebar state interface
interface SidebarState {
  isOpen: boolean;
  openMobile: boolean;
}

// Get initial state from cookie if available
const initialState: SidebarState = {
  isOpen: true, // Default is open
  openMobile: false,
};

export const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isOpen = !state.isOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
      state.openMobile = action.payload;
    },
  },
});

// Export actions
export const {
  toggleSidebar,
  setSidebarOpen,
} = sidebarSlice.actions;

// Export selectors
export const selectSidebarOpen = (state: RootState) => state.sidebar.isOpen;
export const selectSidebarState = (state: RootState) => state.sidebar.isOpen ? 'expanded' : 'collapsed';
export const selectMobileSidebarOpen = (state: RootState) => state.sidebar.openMobile;

export default sidebarSlice.reducer;
