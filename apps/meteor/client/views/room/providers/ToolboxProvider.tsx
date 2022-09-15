import type { IRoom } from '@rocket.chat/core-typings';
import { useDebouncedState, useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useSession, useCurrentRoute, useRoute, useUserId, useSetting } from '@rocket.chat/ui-contexts';
import React, { ReactNode, useContext, useMemo, useState, useLayoutEffect, useEffect } from 'react';

import {
	removeTabBarContext,
	setTabBarContext,
	ToolboxContext,
	ToolboxContextValue,
	ToolboxEventHandler,
} from '../lib/Toolbox/ToolboxContext';
import { Store } from '../lib/Toolbox/generator';
import { ToolboxAction, ToolboxActionConfig } from '../lib/Toolbox/index';
import VirtualAction from './VirtualAction';

const useToolboxActions = (room: IRoom): { listen: ToolboxEventHandler; actions: Array<[string, ToolboxAction]> } => {
	const { listen, actions } = useContext(ToolboxContext);
	const [state, setState] = useState<Array<[string, ToolboxAction]>>(Array.from(actions.entries()));

	useLayoutEffect(() => {
		const stop = listen((actions) => {
			setState(Array.from(actions.entries()));
		});
		return (): void => {
			stop();
		};
	}, [listen, room, setState]);

	return { listen, actions: state };
};

const ToolboxProvider = ({ children, room }: { children: ReactNode; room: IRoom }): JSX.Element => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const uid = useUserId();
	const [activeTabBar, setActiveTabBar] = useState<[ToolboxActionConfig | undefined, string?]>([undefined]);
	const [list, setList] = useSafely(useDebouncedState<Store<ToolboxAction>>(new Map(), 5));
	const handleChange = useMutableCallback((fn) => {
		fn(list);
		setList((list) => new Map(list));
	});
	const { listen, actions } = useToolboxActions(room);

	const [routeName, params] = useCurrentRoute();
	const router = useRoute(routeName || '');

	const currentRoom = useSession('openedRoom');

	const tab = params?.tab;
	const context = params?.context;

	const close = useMutableCallback(() => {
		router.push({
			...params,
			tab: '',
			context: '',
		});
	});

	const open = useMutableCallback((actionId: string, context?: string) => {
		if (actionId === activeTabBar[0]?.id && context === undefined) {
			return close();
		}

		router.push({
			...params,
			tab: actionId,
			context: context ?? '',
		});
	});

	const openUserInfo = useMutableCallback((username) => {
		switch (room.t) {
			case 'l':
				open('room-info', username);
				break;
			case 'd':
				(room.uids?.length ?? 0) > 2 ? open('user-info-group', username) : open('user-info', username);
				break;
			default:
				open('members-list', username);
				break;
		}
	});

	useLayoutEffect(() => {
		if (!tab) {
			setActiveTabBar([undefined, undefined]);
		}

		setActiveTabBar([list.get(tab as string) as ToolboxActionConfig, context]);
	}, [tab, list, currentRoom, context]);

	const contextValue = useMemo(
		() => ({
			listen,
			actions: new Map(list),
			activeTabBar: activeTabBar[0],
			context: activeTabBar[1],
			open,
			close,
			openUserInfo,
		}),
		[listen, list, activeTabBar, open, close, openUserInfo],
	);

	// TODO: remove this when the messages are running on react diretly, not wrapped by blaze
	useEffect(() => {
		setTabBarContext(room._id, contextValue);
		return (): void => {
			removeTabBarContext(room._id);
		};
	}, [contextValue, room._id]);

	return (
		<ToolboxContext.Provider value={contextValue}>
			{actions
				.filter(
					([, action]) => uid || (allowAnonymousRead && action.hasOwnProperty('anonymous') && (action as ToolboxActionConfig).anonymous),
				)
				.map(([id, item]) => (
					<VirtualAction action={item} room={room} id={id} key={id + room._id} handleChange={handleChange} />
				))}
			{children}
		</ToolboxContext.Provider>
	);
};

export const useTabContext = (): unknown | undefined => useContext(ToolboxContext).context;
export const useTab = (): ToolboxActionConfig | undefined => useContext(ToolboxContext).activeTabBar;
export const useTabBarOpen = (): ((actionId: string, context?: string) => void) => useContext(ToolboxContext).open;
export const useTabBarClose = (): (() => void) => useContext(ToolboxContext).close;
export const useTabBarOpenUserInfo = (): ((username: string) => void) => useContext(ToolboxContext).openUserInfo;
export const useTabBarAPI = (): ToolboxContextValue => useContext(ToolboxContext);

export default ToolboxProvider;
