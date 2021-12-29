import { Rooms } from '../../../models/server';

export const getUserSingleOwnedRooms = function (subscribedRooms) {
	const roomsThatWillChangeOwner = subscribedRooms.filter(({ shouldChangeOwner }) => shouldChangeOwner).map(({ rid }) => rid);
	const roomsThatWillBeRemoved = subscribedRooms.filter(({ shouldBeRemoved }) => shouldBeRemoved).map(({ rid }) => rid);

	const roomIds = roomsThatWillBeRemoved.concat(roomsThatWillChangeOwner);
	const rooms = Rooms.findByIds(roomIds, { fields: { _id: 1, name: 1, fname: 1 } });

	const result = {
		shouldBeRemoved: [],
		shouldChangeOwner: [],
	};

	rooms.forEach((room) => {
		const name = room.fname || room.name;
		if (roomsThatWillBeRemoved.includes(room._id)) {
			result.shouldBeRemoved.push(name);
		} else {
			result.shouldChangeOwner.push(name);
		}
	});

	return result;
};
