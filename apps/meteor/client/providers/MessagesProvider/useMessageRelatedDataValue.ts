import type { IMessage } from '@rocket.chat/core-typings';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { MessageConversation, MessageRelatedDataContextValue } from '@rocket.chat/ui-message-list';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';

import type { MessagePlace, PlaceConversationStore } from './placeConversationStore';
import { createPlaceConversationStore } from './placeConversationStore';
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

type ConversationSelection<TSelected> = { enabled: boolean; select?: (conversation: MessageConversation) => TSelected };

/** The room and the subscription of a message: the place's own when it is the place's room, else the client's stores', with no request. */
const useConversation = <TSelected = MessageConversation>(
	place: PlaceConversationStore,
	message: IMessage,
	{ enabled, select }: ConversationSelection<TSelected>,
) => {
	const inPlace = useSyncExternalStore(place.subscribe, () => place.getRoomId() === message.rid);
	const inPlaceData = useSyncExternalStore(place.subscribe, () => {
		if (!enabled || !inPlace) {
			return undefined;
		}
		return select ? select(place.getConversation()) : place.getConversation();
	});
	const roomOfMessage = Rooms.use((state) => (enabled && !inPlace ? state.get(message.rid) : undefined));
	const subscriptionOfMessage = Subscriptions.use((state) =>
		enabled && !inPlace ? state.find((record) => record.rid === message.rid) : undefined,
	);

	return useMemo(() => {
		if (!enabled) {
			return { data: undefined, isLoading: false, isError: false };
		}

		if (inPlace) {
			return { data: inPlaceData as TSelected, isLoading: false, isError: false };
		}

		const conversation = { room: roomOfMessage, subscription: subscriptionOfMessage };

		return { data: (select ? select(conversation) : conversation) as TSelected, isLoading: false, isError: false };
	}, [enabled, inPlace, inPlaceData, roomOfMessage, subscriptionOfMessage, select]);
};

/**
 * Data messages show about other things, read from the client's stores first and fetched when missing. The value is the same for as long
 * as the place's roles are, so a change of the room or the subscription renders only the readers of what it changed.
 */
export const useMessageRelatedDataValue = (place: MessagePlace, placeUserRoles?: PlaceUserRoles): MessageRelatedDataContextValue => {
	const [placeStore] = useState(() => createPlaceConversationStore(place));
	placeStore.replace(place);
	useLayoutEffect(() => placeStore.flush());

	return useMemo(
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
			useConversation: (message, options) => useConversation(placeStore, message, options),
			useCollapsedState,
		}),
		[placeStore, placeUserRoles],
	);
};
