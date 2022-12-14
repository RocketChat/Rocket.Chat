import type { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, useContext } from 'react';

import type { ToolboxActionConfig, ToolboxAction, Events } from '../lib/Toolbox';
import { actions, listen } from '../lib/Toolbox';
import '../lib/Toolbox/defaultActions';

export type ToolboxEventHandler = (handler: EventHandlerOf<Events, 'change'>) => () => void;

export type ToolboxContextValue = {
	actions: Map<ToolboxActionConfig['id'], ToolboxAction>;
	listen: ToolboxEventHandler;
	tabBar?: any;
	context?: any;
	open: (actionId: string, context?: string) => void;
	openRoomInfo: (username?: string) => void;
	close: () => void;
	activeTabBar?: ToolboxActionConfig;
	setData?: (data: Record<string, unknown>) => void;
};

export const ToolboxContext = createContext<ToolboxContextValue>({
	actions,
	listen,
	open: () => undefined,
	openRoomInfo: () => undefined,
	close: () => undefined,
});

export const useToolboxContext = (): ToolboxContextValue => useContext(ToolboxContext);

export const useTabContext = (): unknown | undefined => useContext(ToolboxContext).context;
export const useTab = (): ToolboxActionConfig | undefined => useContext(ToolboxContext).activeTabBar;
export const useTabBarOpen = (): ((actionId: string, context?: string) => void) => useContext(ToolboxContext).open;
export const useTabBarClose = (): (() => void) => useContext(ToolboxContext).close;
export const useTabBarOpenUserInfo = (): ((username: string) => void) => useContext(ToolboxContext).openRoomInfo;
