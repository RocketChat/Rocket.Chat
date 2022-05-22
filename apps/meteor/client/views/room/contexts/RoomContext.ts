import { IRoom, IOmnichannelRoom, isOmnichannelRoom, isVoipRoom, IVoipRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type RoomContextValue = {
	rid: IRoom['_id'];
	// room: IRoom;
	// events: any;
	// tabBar: TabBar;
	room: IRoom;
	subscribed: boolean;
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

export const useVoipRoom = (): IVoipRoom => {
	const { room } = useContext(RoomContext) || {};

	if (!room) {
		throw new Error('use useRoom only inside opened rooms');
	}

	if (!isVoipRoom(room)) {
		throw new Error('invalid room type');
	}

	return room;
};
