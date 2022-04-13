import type { IRoom } from '@rocket.chat/core-typings';

import { Rooms } from '../../../models/server';
import { SubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';

export const getUserSingleOwnedRooms = function (subscribedRooms: SubscribedRoomsForUserWithDetails[]): unknown {
	const roomsThatWillChangeOwner = subscribedRooms
		.filter(({ shouldChangeOwner }) => shouldChangeOwner)
		.map(({ rid }: { rid: string }) => rid);
	const roomsThatWillBeRemoved = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }: { rid: string }) => rid);

	const roomIds = roomsThatWillBeRemoved.concat(roomsThatWillChangeOwner);
	const rooms = Rooms.findByIds(roomIds, { fields: { _id: 1, name: 1, fname: 1 } });

	const result = {
		shouldBeRemoved: [] as string[],
		shouldChangeOwner: [] as string[],
	};

	rooms.forEach((room: IRoom) => {
		const name = room.fname || room.name;
		if (roomsThatWillBeRemoved.includes(room._id)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			result.shouldBeRemoved.push(name!);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			result.shouldChangeOwner.push(name!);
		}
	});

	return result;
};
