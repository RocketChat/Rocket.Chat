import { EventHandlerOf } from '@rocket.chat/emitter';
import { createContext, MouseEventHandler, useContext } from 'react';

import { actions, listen, ToolboxActionConfig, ToolboxAction, Events } from '.';
import { IRoom } from '../../../../../definition/IRoom';
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


/*
 * @deprecated
 * we cannot reach this context because the messages are wrapped by blaze
 */


const tabbarStore = new Map<IRoom['_id'], ToolboxContextValue>();

/*
 * @deprecated
 * we cannot reach this context because the messages are wrapped by blaze
 */
export const getTabBarContext = (rid: IRoom['_id']): ToolboxContextValue => {
	const result = tabbarStore.get(rid);
	if (!result) {
		throw new Error('Tabbar context not found');
	}
	return result;
};

export const setTabBarContext = (rid: IRoom['_id'], context: ToolboxContextValue): void => {
	tabbarStore.set(rid, context);
};

export const removeTabBarContext = (rid: IRoom['_id']): void => {
	tabbarStore.delete(rid);
};
