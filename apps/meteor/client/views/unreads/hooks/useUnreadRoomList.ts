import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import { useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useQueryOptions } from '../../../sidebar/hooks/useQueryOptions';

const query = { open: { $ne: false } };

export const useUnreadRoomList = (): Array<ISubscription & IRoom> => {
	const [roomList, setRoomList] = useDebouncedState<(ISubscription & IRoom)[]>([], 150);

	const options = useQueryOptions();

	const rooms = useUserSubscriptions(query, options) as (ISubscription & IRoom)[];

	useEffect(() => {
		setRoomList(rooms.filter((room) => room?.unread || room?.tunread?.length));
	}, [setRoomList, rooms]);

	return roomList;
};
