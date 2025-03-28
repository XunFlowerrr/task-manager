import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import sidebarReducer from './slices/sidebarSlice';

export const store = configureStore({
  reducer: {
    sidebar: sidebarReducer,
    // Add other reducers here as needed
  },
  // Enable Redux DevTools extension if available
  devTools: process.env.NODE_ENV !== 'production',
});

// Define types for Redux hooks
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Define typed versions of the hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
