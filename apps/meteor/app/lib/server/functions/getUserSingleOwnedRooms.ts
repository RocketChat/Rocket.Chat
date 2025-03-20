import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import type { SubscribedRoomsForUserWithDetails } from './getRoomsWithSingleOwner';

export const getUserSingleOwnedRooms = async function (subscribedRooms: SubscribedRoomsForUserWithDetails[]) {
	const roomsThatWillChangeOwner = subscribedRooms
		.filter(({ shouldChangeOwner }) => shouldChangeOwner)
		.map(({ rid }: { rid: string }) => rid);
	const roomsThatWillBeRemoved = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }: { rid: string }) => rid);

	const roomIds = roomsThatWillBeRemoved.concat(roomsThatWillChangeOwner);
	const rooms = Rooms.findByIds(roomIds, { projection: { _id: 1, name: 1, fname: 1 } });

	const result = {
		shouldBeRemoved: [] as string[],
		shouldChangeOwner: [] as string[],
	};

	await rooms.forEach((room: IRoom) => {
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
