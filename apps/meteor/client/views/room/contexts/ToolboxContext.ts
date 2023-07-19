import { createContext, useContext } from 'react';

import type { ToolboxAction } from '../lib/Toolbox';

export type ToolboxContextValue = {
	actions: Map<ToolboxAction['id'], ToolboxAction>;
	tabBar?: any;
	context?: any;
	open: (actionId: string, context?: string) => void;
	openRoomInfo: (username?: string) => void;
	close: () => void;
	activeTabBar?: ToolboxAction;
	setData?: (data: Record<string, unknown>) => void;
};

export const ToolboxContext = createContext<ToolboxContextValue>({
	actions: new Map(),
	open: () => undefined,
	openRoomInfo: () => undefined,
	close: () => undefined,
});

export const useTabContext = (): unknown | undefined => useContext(ToolboxContext).context;
export const useTab = (): ToolboxAction | undefined => useContext(ToolboxContext).activeTabBar;
export const useTabBarOpen = (): ((actionId: string, context?: string) => void) => useContext(ToolboxContext).open;
export const useTabBarClose = (): (() => void) => useContext(ToolboxContext).close;
export const useTabBarOpenUserInfo = (): ((username: string) => void) => useContext(ToolboxContext).openRoomInfo;
