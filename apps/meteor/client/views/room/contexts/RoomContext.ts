import type { IRoom, IOmnichannelRoom, IVoipRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom, isVoipRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export type RoomContextValue = {
	rid: IRoom['_id'];
	room: IRoom;
	subscription?: ISubscription;
	hasMorePreviousMessages: boolean;
	hasMoreNextMessages: boolean;
	isLoadingMoreMessages: boolean;
};

export const RoomContext = createContext<RoomContextValue | null>(null);

export const useUserIsSubscribed = (): boolean => {
	const context = useContext(RoomContext);

	if (!context) {
		throw new Error('use useRoom only inside opened rooms');
	}

	return !!context.subscription;
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

export const useRoomMessages = (): {
	hasMorePreviousMessages: boolean;
	hasMoreNextMessages: boolean;
	isLoadingMoreMessages: boolean;
} => {
	const context = useContext(RoomContext);

	if (!context) {
		throw new Error('use useRoomMessages only inside opened rooms');
	}

	return {
		hasMorePreviousMessages: context.hasMorePreviousMessages,
		hasMoreNextMessages: context.hasMoreNextMessages,
		isLoadingMoreMessages: context.isLoadingMoreMessages,
	};
};

export const useOmnichannelRoom = (): IOmnichannelRoom => {
	// TODO: today if the user do not belong in the room, the room object will not update on new changes
	// for normal rooms this is OK, but for Omnichannel rooms,
	// there are cases where an agent can be outside of the room but need to see the room changes
	// A solution would be to use subscribeToRoom to get the room updates

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
