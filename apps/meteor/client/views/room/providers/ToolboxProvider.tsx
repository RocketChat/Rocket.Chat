import type { IRoom } from '@rocket.chat/core-typings';
import { useDebouncedState, useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useUserId, useSetting, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import type { ToolboxContextValue } from '../contexts/ToolboxContext';
import { ToolboxContext } from '../contexts/ToolboxContext';
import type { Store } from '../lib/Toolbox/generator';
import type { ToolboxAction, ToolboxActionConfig } from '../lib/Toolbox/index';
import VirtualAction from './VirtualAction';
import { useToolboxActions } from './hooks/useToolboxActions';

const ToolboxProvider = ({ children, room }: { children: ReactNode; room: IRoom }): JSX.Element => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');
	const uid = useUserId();
	const [list, setList] = useSafely(useDebouncedState<Store<ToolboxAction>>(new Map<string, ToolboxActionConfig>(), 5));
	const handleChange = useMutableCallback((fn) => {
		fn(list);
		setList((list) => new Map(list));
	});
	const { listen, actions } = useToolboxActions(room);

	const router = useRouter();

	const tab = useRouteParameter('tab');
	const context = useRouteParameter('context');

	const activeTabBar = useMemo(
		(): [ToolboxActionConfig | undefined, string?] => [tab ? (list.get(tab) as ToolboxActionConfig) : undefined, context],
		[tab, list, context],
	);

	const close = useMutableCallback(() => {
		const routeName = router.getRouteName();

		if (!routeName) {
			throw new Error('Route name is not defined');
		}

		router.navigate({
			name: routeName,
			params: {
				...router.getRouteParameters(),
				tab: '',
				context: '',
			},
			search: router.getSearchParameters(),
		});
	});

	const open = useMutableCallback((actionId: string, context?: string) => {
		if (actionId === activeTabBar[0]?.id && context === undefined) {
			return close();
		}

		const routeName = router.getRouteName();

		if (!routeName) {
			throw new Error('Route name is not defined');
		}

		const { layout } = router.getSearchParameters();

		router.navigate({
			name: routeName,
			params: {
				...router.getRouteParameters(),
				tab: actionId,
				context: context ?? '',
			},
			search: layout ? { layout } : undefined,
		});
	});

	const openRoomInfo = useMutableCallback((username?: string) => {
		switch (room.t) {
			case 'l':
				open('room-info', username);
				break;
			case 'v':
				open('voip-room-info', username);
				break;
			case 'd':
				(room.uids?.length ?? 0) > 2 ? open('user-info-group', username) : open('user-info', username);
				break;
			default:
				open('members-list', username);
				break;
		}
	});

	const contextValue = useMemo(
		(): ToolboxContextValue => ({
			listen,
			actions: new Map(list),
			activeTabBar: activeTabBar[0],
			context: activeTabBar[1],
			open,
			close,
			openRoomInfo,
		}),
		[listen, list, activeTabBar, open, close, openRoomInfo],
	);

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

export default ToolboxProvider;
