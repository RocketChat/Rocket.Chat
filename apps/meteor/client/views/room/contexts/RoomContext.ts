import { IRoom, IOmnichannelRoom, isOmnichannelRoom, isVoipRoom, IVoipRoom, ISubscription } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type RoomContextValue = {
	rid: IRoom['_id'];
	room: IRoom;
	subscription?: ISubscription;
};

export const RoomContext = createContext<RoomContextValue | null>(null);

export const useUserIsSubscribed = (): boolean => {
	const context = useContext(RoomContext);

	if (!context) {
		throw new Error('use useRoom only inside opened rooms');
	}

	return context.subscribed ?? false;
};

export const useRoom = (): IRoom => {
	const { room } = useContext(RoomContext) || {};

	if (!room) {
		throw new Error('use useRoom only inside opened rooms');
	}

	return room;
};

export const useRoomSubscription = (): ISubscription | undefined => {
	const context = useContext(RoomContext);

	if (!context) {
		throw new Error('use useRoomSubscription only inside opened rooms');
	}

	return context.subscription;
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
