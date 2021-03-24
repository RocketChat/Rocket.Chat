import { createContext } from 'react';
import { EventHandlerOf } from '@rocket.chat/emitter';

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
	close: Function;
	activeTabBar?: ToolboxActionConfig;
}

export const ToolboxContext = createContext<ChannelContextValue>({
	actions,
	listen,
	open: () => null,
	openUserInfo: () => null,
	close: () => null,
});
