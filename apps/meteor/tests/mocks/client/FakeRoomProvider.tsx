import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { RoomContext, RoomSubscriptionContext } from '../../../client/views/room/contexts/RoomContext';
import { createFakeRoom, createFakeSubscription } from '../data';

export type FakeRoomProviderProps = {
	children?: ReactNode;
	roomOverrides?: Partial<IRoom>;
	subscriptionOverrides?: Partial<ISubscription>;
};

const FakeRoomProvider = ({ children, roomOverrides, subscriptionOverrides }: FakeRoomProviderProps) => {
	const room = useMemo(() => createFakeRoom(roomOverrides), [roomOverrides]);
	const subscription = useMemo(() => createFakeSubscription(subscriptionOverrides), [subscriptionOverrides]);
	const context = useMemo(() => ({ rid: room._id, room, subscribed: true }), [room]);

	return (
		<RoomContext.Provider value={context}>
			<RoomSubscriptionContext.Provider value={subscription}>{children}</RoomSubscriptionContext.Provider>
		</RoomContext.Provider>
	);
};

export default FakeRoomProvider;
