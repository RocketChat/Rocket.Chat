import { useEffectEvent, useStableArray } from '@rocket.chat/fuselage-hooks';
import { useUserId, useSetting, useRouter, useRouteParameter, useLayoutHiddenActions } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { useRoom } from '../contexts/RoomContext';
import { RoomToolboxContext } from '../contexts/RoomToolboxContext';
import type { RoomToolboxContextValue } from '../contexts/RoomToolboxContext';
import { getRoomGroup } from '../lib/getRoomGroup';
import { useAppsRoomActions } from './hooks/useAppsRoomActions';
import { useCoreRoomActions } from './hooks/useCoreRoomActions';

type RoomToolboxProviderProps = { children: ReactNode };

const RoomToolboxProvider = ({ children }: RoomToolboxProviderProps) => {
	const room = useRoom();

	const router = useRouter();

	const openTab = useEffectEvent((actionId: string, context?: string) => {
		if (actionId === tab?.id && context === undefined) {
			return closeTab();
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

	const closeTab = useEffectEvent(() => {
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

	const context = useRouteParameter('context');

	const coreRoomActions = useCoreRoomActions();
	const appsRoomActions = useAppsRoomActions();

	const allowAnonymousRead = useSetting<boolean>('Accounts_AllowAnonymousRead', false);
	const uid = useUserId();

	const { roomToolbox: hiddenActions } = useLayoutHiddenActions();

	const actions = useStableArray(
		[...coreRoomActions, ...appsRoomActions]
			.filter((action) => uid || (allowAnonymousRead && 'anonymous' in action && action.anonymous))
			.filter((action) => !action.groups || action.groups.includes(getRoomGroup(room)))
			.filter((action) => !hiddenActions.includes(action.id))
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
			openTab,
			closeTab,
		}),
		[actions, tab, context, openTab, closeTab],
	);

	return <RoomToolboxContext.Provider value={contextValue}>{children}</RoomToolboxContext.Provider>;
};

export default RoomToolboxProvider;
