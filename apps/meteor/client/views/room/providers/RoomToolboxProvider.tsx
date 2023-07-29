import type { RoomType, IRoom } from '@rocket.chat/core-typings';
import { useMutableCallback, useStableArray } from '@rocket.chat/fuselage-hooks';
import { useUserId, useSetting, useRouter, useRouteParameter } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { useRoom } from '../contexts/RoomContext';
import type { RoomToolboxContextValue } from '../contexts/RoomToolboxContext';
import { RoomToolboxContext } from '../contexts/RoomToolboxContext';
import type { ToolboxActionConfig } from '../lib/Toolbox/index';
import { useAppsRoomActions } from './hooks/useAppsRoomActions';
import { useCoreRoomActions } from './hooks/useCoreRoomActions';

const groupsDict = {
	l: 'live',
	v: 'voip',
	d: 'direct',
	p: 'group',
	c: 'channel',
} as const satisfies Record<RoomType, ToolboxActionConfig['groups'][number]>;

const getGroup = (room: IRoom) => {
	if (room.teamMain) {
		return 'team';
	}

	if (room.t === 'd' && (room.uids?.length ?? 0) > 2) {
		return 'direct_multiple';
	}

	return groupsDict[room.t];
};

type RoomToolboxProviderProps = { children: ReactNode };

const RoomToolboxProvider = ({ children }: RoomToolboxProviderProps) => {
	const room = useRoom();

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
		if (actionId === tab?.id && context === undefined) {
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

	const context = useRouteParameter('context');

	const coreRoomActions = useCoreRoomActions();
	const appsRoomActions = useAppsRoomActions();

	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead', false);
	const uid = useUserId();

	const actions = useStableArray(
		[...coreRoomActions, ...appsRoomActions]
			.filter((action) => uid || (allowAnonymousRead && 'anonymous' in action && action.anonymous))
			.filter((action) => !action.groups || action.groups.includes(getGroup(room)))
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
	);

	const tabActionId = useRouteParameter('tab');
	const tab = useMemo(() => {
		if (!tabActionId) {
			return undefined;
		}

		return actions.find((action) => action.id === tabActionId);
	}, [actions, tabActionId]);

	const contextValue = useMemo(
		(): RoomToolboxContextValue => ({
			actions,
			tab,
			context,
			open,
			close,
			openRoomInfo,
		}),
		[actions, tab, context, open, close, openRoomInfo],
	);

	return <RoomToolboxContext.Provider value={contextValue}>{children}</RoomToolboxContext.Provider>;
};

export default RoomToolboxProvider;
