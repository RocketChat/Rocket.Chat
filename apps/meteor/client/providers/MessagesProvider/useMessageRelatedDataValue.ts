import type { IMessage } from '@rocket.chat/core-typings';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { MessageRelatedDataContextValue } from '@rocket.chat/ui-message-list';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { useParentMessage } from './useParentMessage';
import type { PlaceUserRoles } from './useRolesByUser';
import { useUserRolesByScope } from '../../hooks/useUserRolesByScope';
import { RoomManager, getCollapsibleEventKey, useOpenedRoom } from '../../lib/RoomManager';
import { messagesQueryKeys } from '../../lib/queryKeys';
import { Rooms, Subscriptions } from '../../stores';
import { useGetMessageByID } from '../../views/room/contextualBar/Threads/hooks/useGetMessageByID';

const useCollapsedState = (key: string, initiallyCollapsed: boolean): [boolean, () => void] => {
	const rid = useOpenedRoom();
	const store = rid && key ? RoomManager.getStore(rid) : undefined;

	const { subscribe, getSnapshot } = useMemo(() => {
		if (!store) {
			return { subscribe: () => () => undefined, getSnapshot: () => false };
		}
		return {
			subscribe: (callback: () => void) => store.on(getCollapsibleEventKey(key), callback),
			getSnapshot: () => store.isCollapsibleToggled(key),
		};
	}, [store, key]);

	const toggled = useSyncExternalStore(subscribe, getSnapshot);
	const [localCollapsed, toggleLocalCollapsed] = useToggle(initiallyCollapsed);
	const togglePersisted = useCallback(() => store?.toggleCollapsible(key), [store, key]);

	if (!store) {
		return [localCollapsed, () => toggleLocalCollapsed()];
	}

	return [toggled !== initiallyCollapsed, togglePersisted];
};

/** Data messages show about other things, read from the client's stores first and fetched when missing. */
export const useMessageRelatedDataValue = (placeUserRoles?: PlaceUserRoles): MessageRelatedDataContextValue =>
	useMemo(
		() => ({
			usePlaceUserRoles: (uid, rid) => (placeUserRoles?.rid === rid ? placeUserRoles.get(uid) : undefined),
			useUserRoles: (uid, rid, { enabled }) => useUserRolesByScope(uid, rid, { enabled }),
			useParentMessage: (tmid) => {
				const { data, isLoading, isError } = useParentMessage(tmid);
				return { data, isLoading, isError };
			},
			useMessageById: (messageId, { enabled, revision = [] } = { enabled: true }) => {
				const getMessage = useGetMessageByID(false);
				const { data, isLoading, isError } = useQuery({
					queryKey: messagesQueryKeys.messageRevision(messageId, revision),
					queryFn: () => getMessage(messageId),
					enabled,
					staleTime: 5 * 60 * 1000,
				});
				return { data, isLoading, isError };
			},
			useConversation: (message: IMessage, { enabled }) => {
				const { data, isLoading, isError } = useQuery({
					queryKey: ['messages', message._id, 'conversation'],
					queryFn: async () => ({
						room: Rooms.state.get(message.rid),
						subscription: Subscriptions.state.find((record) => record.rid === message.rid),
					}),
					enabled,
				});
				return { data, isLoading, isError };
			},
			useCollapsedState,
		}),
		[placeUserRoles],
	);
