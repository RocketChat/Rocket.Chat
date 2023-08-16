import type { IRoom } from '@rocket.chat/core-typings';
import { isDirectMessageRoom } from '@rocket.chat/core-typings';

import { useRoomName } from '../../../../../hooks/useRoomName';

export const useMessageBoxPlaceholder = (placeholder: string, room?: IRoom) => {
	if (!room) {
		throw new Error('In order to get the placeholder a `room` must be provided');
	}

	const roomName = useRoomName(room);

	if (isDirectMessageRoom(room)) {
		return `${placeholder} @${roomName}`;
	}

	return `${placeholder} #${roomName}`;
};
