import { createContext, useContext } from 'react';

type SidebarContextValue = [boolean, (open: boolean | ((isOpen: boolean) => boolean)) => void];

export const SidebarContext = createContext<SidebarContextValue>([false, (): void => undefined]);

export const useSidebar = (): SidebarContextValue => useContext(SidebarContext);
