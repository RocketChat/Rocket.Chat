import { createContext, useContext } from 'react';

import type { ToolboxActionConfig } from '../lib/Toolbox';

export type RoomToolboxContextValue = {
	actions: ToolboxActionConfig[];
	tab?: ToolboxActionConfig;
	context?: string;
	open: (actionId: string, context?: string) => void;
	openRoomInfo: (username?: string) => void;
	close: () => void;
};

export const RoomToolboxContext = createContext<RoomToolboxContextValue>({
	actions: [],
	open: () => undefined,
	openRoomInfo: () => undefined,
	close: () => undefined,
});

export const useRoomToolbox = () => useContext(RoomToolboxContext);

export const useTabBarOpen = (): ((actionId: string, context?: string) => void) => useContext(RoomToolboxContext).open;
export const useTabBarClose = (): (() => void) => useContext(RoomToolboxContext).close;
export const useTabBarOpenUserInfo = (): ((username: string) => void) => useContext(RoomToolboxContext).openRoomInfo;
