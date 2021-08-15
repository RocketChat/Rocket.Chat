import { createContext, useContext } from 'react';

import { IRoom, IOmnichannelRoom, isOmnichannelRoom } from '../../../../definition/IRoom';

export type RoomContextValue = {
	rid: IRoom['_id'];
	room: IRoom;
};

export const RoomContext = createContext<RoomContextValue | null>(null);

export const useRoom = (): IRoom => {
	const { room } = useContext(RoomContext) || {};
	if (!room) {
		throw new Error('use useRoom only inside opened rooms');
	}
	return room;
};

export const useOmnichannelRoom = (): IOmnichannelRoom => {
	const { room } = useContext(RoomContext) || {};

	if (!room) {
		throw new Error('use useRoom only inside opened rooms');
	}
	if (!isOmnichannelRoom(room)) {
		throw new Error('invalid room type');
	}

	return room;
};
