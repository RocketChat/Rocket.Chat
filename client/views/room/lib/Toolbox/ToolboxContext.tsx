import { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, MouseEventHandler } from 'react';

import { actions, listen, ToolboxActionConfig, ToolboxAction, Events } from '.';
import './defaultActions';

export type ToolboxEventHandler = (handler: EventHandlerOf<Events, 'change'>) => Function;

export type ChannelContextValue = {
	actions: Map<ToolboxActionConfig['id'], ToolboxAction>;
	listen: ToolboxEventHandler;
	tabBar?: any;
	context?: any;
	open: Function;
	openUserInfo: Function;
	close: MouseEventHandler<HTMLOrSVGElement>;
	activeTabBar?: ToolboxActionConfig;
};

export const ToolboxContext = createContext<ChannelContextValue>({
	actions,
	listen,
	open: () => null,
	openUserInfo: () => null,
	close: () => null,
});
