import { createContext, useContext } from 'react';

export const SidebarContext = createContext([false, () => {}]);

export const useSidebar = () => useContext(SidebarContext);
