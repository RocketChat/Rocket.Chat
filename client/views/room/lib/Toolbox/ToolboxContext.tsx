import { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, MouseEventHandler, useContext } from 'react';

import { actions, listen, ToolboxActionConfig, ToolboxAction, Events } from '.';
import './defaultActions';

export type ToolboxEventHandler = (handler: EventHandlerOf<Events, 'change'>) => Function;

export type ToolboxContextValue = {
	actions: Map<ToolboxActionConfig['id'], ToolboxAction>;
	listen: ToolboxEventHandler;
	tabBar?: any;
	context?: any;
	open: Function;
	openUserInfo: Function;
	close: MouseEventHandler<HTMLOrSVGElement>;
	activeTabBar?: ToolboxActionConfig;
};

export const ToolboxContext = createContext<ToolboxContextValue>({
	actions,
	listen,
	open: () => null,
	openUserInfo: () => null,
	close: () => null,
});

export const useToolboxContext = (): ToolboxContextValue => useContext(ToolboxContext);
