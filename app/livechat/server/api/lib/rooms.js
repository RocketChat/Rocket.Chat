import { LivechatRooms } from '../../../../models/server/raw';

export async function findRooms({
	agents,
	roomName,
	departmentId,
	open,
	createdAt,
	closedAt,
	tags,
	customFields,
	options: {
		offset,
		count,
		fields,
		sort,
	},
}) {
	const total = (await LivechatRooms.findRoomsWithCriteria({
		agents,
		roomName,
		departmentId,
		open,
		createdAt,
		closedAt,
		tags,
		customFields,
	})).length;

	const rooms = await LivechatRooms.findRoomsWithCriteria({
		agents,
		roomName,
		departmentId,
		open,
		createdAt,
		closedAt,
		tags,
		customFields,
		options: {
			sort: sort || { ts: 1 },
			skip: offset,
			limit: count,
			fields,
		},
	});

	return {
		rooms,
		count: rooms.length,
		offset,
		total,
	};
}
