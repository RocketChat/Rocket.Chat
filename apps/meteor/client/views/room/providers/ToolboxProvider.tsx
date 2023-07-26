import type { IRoom } from '@rocket.chat/core-typings';
import { useDebouncedState, useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useUserId, useSetting, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useContext, useLayoutEffect, useMemo, useState } from 'react';

import type { ToolboxContextValue } from '../contexts/ToolboxContext';
import { ToolboxContext } from '../contexts/ToolboxContext';
import type { ToolboxAction, ToolboxActionConfig } from '../lib/Toolbox/index';
import VirtualAction from './VirtualAction';
import { useAppsRoomActions } from './hooks/useAppsRoomActions';

const ToolboxProvider = ({ children, room }: { children: ReactNode; room: IRoom }) => {
	const [list, setList] = useSafely(useDebouncedState(() => new Map<string, ToolboxActionConfig>(), 5));
	const handleChange = useMutableCallback((fn) => {
		fn(list);
		setList((list) => new Map(list));
	});

	const router = useRouter();

	const tab = useRouteParameter('tab');

	const activeTabBar = useMemo(() => (tab ? list.get(tab) : undefined), [tab, list]);

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
		if (actionId === activeTabBar?.id && context === undefined) {
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

	const { listen, actions } = useContext(ToolboxContext);
	const [coreRoomActions, setState] = useSafely(useState<Array<[string, ToolboxAction]>>(Array.from(actions.entries())));

	useLayoutEffect(
		() =>
			listen((actions) => {
				setState(Array.from(actions.entries()));
			}),
		[listen, room, setState],
	);

	const context = useRouteParameter('context');

	const contextValue = useMemo(
		(): ToolboxContextValue => ({
			listen,
			actions: new Map(list),
			activeTabBar,
			context,
			open,
			close,
			openRoomInfo,
		}),
		[listen, list, activeTabBar, context, open, close, openRoomInfo],
	);

	const appsRoomActions = useAppsRoomActions();

	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead', false);
	const uid = useUserId();

	const roomActions = [...coreRoomActions, ...appsRoomActions].filter(
		([, action]) => uid || (allowAnonymousRead && 'anonymous' in action && action.anonymous),
	);

	return (
		<ToolboxContext.Provider value={contextValue}>
			{roomActions.map(([id, roomAction]) => (
				<VirtualAction key={id + room._id} action={roomAction} handleChange={handleChange} />
			))}
			{children}
		</ToolboxContext.Provider>
	);
};

export default ToolboxProvider;
