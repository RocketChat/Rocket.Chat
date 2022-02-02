import { IRoom } from '../../../../definition/IRoom';
import { Rooms } from '../../../models/server';

export const getUserSingleOwnedRooms = function (subscribedRooms: []): unknown {
	const roomsThatWillChangeOwner = subscribedRooms
		.filter(({ shouldChangeOwner }: { shouldChangeOwner: string[] }) => shouldChangeOwner)
		.map(({ rid }: { rid: string }) => rid);
	const roomsThatWillBeRemoved = subscribedRooms
		.filter(({ shouldBeRemoved }: { shouldBeRemoved: string[] }) => shouldBeRemoved)
		.map(({ rid }: { rid: string }) => rid);

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
