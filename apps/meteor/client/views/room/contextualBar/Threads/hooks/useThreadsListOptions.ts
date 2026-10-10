import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { useRoom, useRoomSubscription } from '../../../contexts/RoomContext';

export type ThreadsListType = 'all' | 'following' | 'unread';

/**
 * The `useThreadsList` options for the current room, filtered by `type` and matching `searchText`; settles after
 * the user stops typing.
 */
export const useThreadsListOptions = (type: ThreadsListType, searchText: string) => {
	const room = useRoom();
	const rid = room._id;
	const subscription = useRoomSubscription();
	const subscribed = !!subscription;
	const uid = useUserId();
	const tunread = subscription?.tunread?.sort().join(',');
	const text = useDebouncedValue(searchText, 400);

	return useDebouncedValue(
		useMemo(() => {
			if (type === 'all' || !subscribed || !uid) {
				return {
					rid,
					text,
				};
			}
			switch (type) {
				case 'following':
					return {
						rid,
						text,
						type,
						uid,
					};
				case 'unread':
					return {
						rid,
						text,
						type,
						tunread: tunread?.split(','),
					};
			}
		}, [rid, subscribed, text, tunread, type, uid]),
		300,
	);
};
