import type { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, useContext } from 'react';

import type { ToolboxActionConfig, ToolboxAction, Events } from '../lib/Toolbox';
import { actions, listen } from '../lib/Toolbox';

export type RoomToolboxContextValue = {
	actions: Map<ToolboxActionConfig['id'], ToolboxAction>;
	listen: (handler: EventHandlerOf<Events, 'change'>) => () => void;
	tabBar?: any;
	context?: any;
	open: (actionId: string, context?: string) => void;
	openRoomInfo: (username?: string) => void;
	close: () => void;
	activeTabBar?: ToolboxActionConfig;
	setData?: (data: Record<string, unknown>) => void;
};

export const RoomToolboxContext = createContext<RoomToolboxContextValue>({
	actions,
	listen,
	open: () => undefined,
	openRoomInfo: () => undefined,
	close: () => undefined,
});

export const useRoomToolbox = (): RoomToolboxContextValue => useContext(RoomToolboxContext);

export const useTabContext = (): unknown | undefined => useContext(RoomToolboxContext).context;
export const useTab = (): ToolboxActionConfig | undefined => useContext(RoomToolboxContext).activeTabBar;
export const useTabBarOpen = (): ((actionId: string, context?: string) => void) => useContext(RoomToolboxContext).open;
export const useTabBarClose = (): (() => void) => useContext(RoomToolboxContext).close;
export const useTabBarOpenUserInfo = (): ((username: string) => void) => useContext(RoomToolboxContext).openRoomInfo;
