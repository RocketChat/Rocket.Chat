/* eslint-disable react/no-multi-comp */
import { IRoom } from '@rocket.chat/core-typings';
import { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, useContext } from 'react';

import { actions, listen, ToolboxActionConfig, ToolboxAction, Events } from '.';
import './defaultActions';

export type ToolboxEventHandler = (handler: EventHandlerOf<Events, 'change'>) => () => void;

export type ToolboxContextValue = {
	actions: Map<ToolboxActionConfig['id'], ToolboxAction>;
	listen: ToolboxEventHandler;
	tabBar?: any;
	context?: any;
	open: (actionId: string, context?: string) => void;
	openUserInfo: (username: string) => void;
	close: () => void;
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

/*
 * @deprecated
 * we cannot reach this context because the messages are wrapped by blaze
 */

const tabBarStore = new Map<IRoom['_id'], ToolboxContextValue>();

/*
 * @deprecated
 * we cannot reach this context because the messages are wrapped by blaze
 */
export const getTabBarContext = (rid: IRoom['_id']): ToolboxContextValue => {
	const result = tabBarStore.get(rid);
	if (!result) {
		throw new Error('TabBar context not found');
	}
	return result;
};

export const setTabBarContext = (rid: IRoom['_id'], context: ToolboxContextValue): void => {
	tabBarStore.set(rid, context);
};

export const removeTabBarContext = (rid: IRoom['_id']): void => {
	tabBarStore.delete(rid);
};
