import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { MessageConversation, MessageRelatedDataContextValue } from '@rocket.chat/ui-message-list';
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

export type MessagePlace = { room?: IRoom; subscription?: ISubscription };

/** The room and the subscription of a message: the place's own when it is the place's room, else the client's stores', with no request. */
const useConversation = <TSelected = MessageConversation>(
	{ room, subscription }: MessagePlace,
	message: IMessage,
	{ enabled, select }: { enabled: boolean; select?: (conversation: MessageConversation) => TSelected },
) => {
	const inPlace = !!room && room._id === message.rid;
	const roomOfMessage = Rooms.use((state) => (enabled && !inPlace ? state.get(message.rid) : undefined));
	const subscriptionOfMessage = Subscriptions.use((state) =>
		enabled && !inPlace ? state.find((record) => record.rid === message.rid) : undefined,
	);

	return useMemo(() => {
		if (!enabled) {
			return { data: undefined, isLoading: false, isError: false };
		}

		const conversation = inPlace ? { room, subscription } : { room: roomOfMessage, subscription: subscriptionOfMessage };

		return {
			data: (select ? select(conversation) : conversation) as TSelected,
			isLoading: false,
			isError: false,
		};
	}, [enabled, inPlace, room, subscription, roomOfMessage, subscriptionOfMessage, select]);
};

/** Data messages show about other things, read from the client's stores first and fetched when missing. */
export const useMessageRelatedDataValue = (place: MessagePlace, placeUserRoles?: PlaceUserRoles): MessageRelatedDataContextValue =>
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
			useConversation: (message, options) => useConversation(place, message, options),
			useCollapsedState,
		}),
		[place, placeUserRoles],
	);
