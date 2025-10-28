import { faker } from '@faker-js/faker';
import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import type { ReactNode, ReactElement } from 'react';
import { useMemo } from 'react';

import { RoomContext } from '../../../client/views/room/contexts/RoomContext';
import { createFakeRoom, createFakeSubscription } from '../data';

type FakeRoomProviderProps = {
	children?: ReactNode;
	roomOverrides?: Partial<IRoom>;
	subscriptionOverrides?: Partial<ISubscription>;
};

const FakeRoomProvider = ({ children, roomOverrides, subscriptionOverrides }: FakeRoomProviderProps): ReactElement => {
	return (
		<RoomContext.Provider
			value={useMemo(() => {
				const room = createFakeRoom(roomOverrides);
				const subscription = faker.datatype.boolean() ? createFakeSubscription(subscriptionOverrides) : undefined;

				return {
					rid: room._id,
					room,
					hasMoreNextMessages: faker.datatype.boolean(),
					hasMorePreviousMessages: faker.datatype.boolean(),
					isLoadingMoreMessages: faker.datatype.boolean(),
					subscription,
				};
			}, [roomOverrides, subscriptionOverrides])}
		>
			{children}
		</RoomContext.Provider>
	);
};

export default FakeRoomProvider;
