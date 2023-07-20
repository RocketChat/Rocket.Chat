import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { useMutableCallback, useStableArray } from '@rocket.chat/fuselage-hooks';
import { useUserId, useSetting, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import type { ToolboxContextValue } from '../contexts/ToolboxContext';
import { ToolboxContext } from '../contexts/ToolboxContext';
import type { ToolboxAction } from '../lib/Toolbox/index';
import { useAppsRoomActions } from './hooks/useAppsRoomActions';
import { useStandardRoomActions } from './hooks/useStandardRoomActions';

const groupsDict = {
	l: 'live',
	v: 'voip',
	d: 'direct',
	p: 'group',
	c: 'channel',
} as const satisfies Record<RoomType, string>;

const getGroupFromRoom = (room: IRoom) => {
	if (room.teamMain) {
		return 'team';
	}

	if (room.t === 'd' && !!room.uids && room.uids.length > 2) {
		return 'direct_multiple';
	}

	return groupsDict[room.t];
};

const isRoomInGroups = (room: IRoom, groups: ToolboxAction['groups']) => {
	return groups.includes(getGroupFromRoom(room));
};

type ToolboxProviderProps = {
	children: ReactNode;
	room: IRoom;
};

const ToolboxProvider = ({ children, room }: ToolboxProviderProps) => {
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);
	const uid = useUserId();

	const standardActions = useStandardRoomActions();
	const appActions = useAppsRoomActions();

	const actions = useStableArray(
		[...standardActions, ...appActions]
			.filter((action) => uid || (allowAnonymousRead && 'anonymous' in action && action.anonymous))
			.filter((action) => isRoomInGroups(room, action.groups)),
	);

	const tab = useRouteParameter('tab');
	const activeTabBar = useMemo(() => actions.find((action) => action.id === tab), [actions, tab]);

	const context = useRouteParameter('context');

	const router = useRouter();

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

	const contextValue = useMemo(
		(): ToolboxContextValue => ({
			actions: new Map(actions.map((action) => [action.id, action])),
			activeTabBar,
			context,
			open,
			close,
			openRoomInfo,
		}),
		[actions, activeTabBar, context, open, close, openRoomInfo],
	);

	return <ToolboxContext.Provider value={contextValue}>{children}</ToolboxContext.Provider>;
};

export default ToolboxProvider;
