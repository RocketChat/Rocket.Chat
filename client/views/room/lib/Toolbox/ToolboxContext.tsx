import { createContext } from 'react';
import { Handler } from '@rocket.chat/emitter';

import { actions, listen, ToolboxActionConfig, ToolboxAction } from '.';
import './defaultActions';


export type ChannelContextValue = {
	actions: Map<ToolboxActionConfig['id'], ToolboxAction>;
	listen: (handler: Handler) => Function;
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
