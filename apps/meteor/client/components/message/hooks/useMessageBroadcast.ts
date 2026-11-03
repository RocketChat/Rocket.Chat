import type { IMessage } from '@rocket.chat/core-typings';
import { useContext } from 'react';

import { Subscriptions } from '../../../stores';
import { RoomContext } from '../../../views/room/contexts/RoomContext';

export const useMessageBroadcast = (message: IMessage): boolean => {
	const roomContext = useContext(RoomContext);
	const isOpenedRoom = roomContext?.rid === message.rid;

	const broadcastFromStore = Subscriptions.use((state) =>
		isOpenedRoom ? undefined : state.find((record) => record.rid === message.rid)?.broadcast,
	);

	return Boolean(isOpenedRoom ? roomContext.subscribed && roomContext.room.broadcast : broadcastFromStore);
};
