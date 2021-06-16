import { createContext, useContext } from 'react';

import { IRoom, IOmnichannelRoom, isOmnichannelRoom } from '../../../../definition/IRoom';
import { IOmnichannelSubscription } from '../../../../definition/ISubscription';

export type RoomContextValue = {
	rid: IRoom['_id'];
	// room: IRoom;
	events: any;
	actions: {
		openUserCard: () => void;
		followMessage: () => void;
		unfollowMessage: () => void;
		openDiscussion: () => void;
		openThread: () => void;
		replyBroadcast: () => void;
	};
	formatters: {
		newDay: (date: Date) => string;
		messageHeader: (date: Date) => string;
	};
	// tabBar: TabBar;
	room: IOmnichannelRoom & IOmnichannelSubscription;
};

export const RoomContext = createContext<RoomContextValue | null>(null);

const normalizeRoomSubscription = (
	room: IOmnichannelRoom & IOmnichannelSubscription,
): IOmnichannelRoom => {
	if (room.department) {
		room.departmentId = room.department;
	}
	return room;
};

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

	return normalizeRoomSubscription(room);
};
