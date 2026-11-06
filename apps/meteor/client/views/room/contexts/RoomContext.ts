import type { IRoom, IOmnichannelRoom, ISubscription } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

export interface IRoomWithFederationOriginalName extends IRoom {
	federationOriginalName?: string;
}

type RoomContextValue = {
	rid: IRoom['_id'];
	room: IRoomWithFederationOriginalName;
	subscribed: boolean;
};

export const RoomContext = createContext<RoomContextValue | null>(null);

// Kept apart from the room so that read marks and unread counters only re-render what reads the subscription.
export const RoomSubscriptionContext = createContext<ISubscription | undefined>(undefined);

export const useUserIsSubscribed = (): boolean => {
	const context = useContext(RoomContext);

	if (!context) {
		throw new Error('use useRoom only inside opened rooms');
	}

	return context.subscribed;
};

export const useRoom = (): IRoom => {
	const context = useContext(RoomContext);

	if (!context) {
		throw new Error('use useRoom only inside opened rooms');
	}

	return context.room;
};

export const useRoomSubscription = (): ISubscription | undefined => {
	const context = useContext(RoomContext);
	const subscription = useContext(RoomSubscriptionContext);

	if (!context) {
		throw new Error('use useRoomSubscription only inside opened rooms');
	}

	return subscription;
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
