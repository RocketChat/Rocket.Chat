import { LivechatRooms, LivechatDepartment } from '../../../../models/server/raw';

export async function findRooms({
	agents,
	roomName,
	departmentId,
	open,
	createdAt,
	closedAt,
	tags,
	customFields,
	onhold,
	options: { offset, count, fields, sort },
}) {
	const cursor = LivechatRooms.findRoomsWithCriteria({
		agents,
		roomName,
		departmentId,
		open,
		createdAt,
		closedAt,
		tags,
		customFields,
		onhold: ['t', 'true', '1'].includes(onhold),
		options: {
			sort: sort || { ts: -1 },
			offset,
			count,
			fields,
		},
	});

	const total = await cursor.count();

	const rooms = await cursor.toArray();

	const departmentsIds = [...new Set(rooms.map((room) => room.departmentId).filter(Boolean))];
	if (departmentsIds.length) {
		const departments = await LivechatDepartment.findInIds(departmentsIds, {
			fields: { name: 1 },
		}).toArray();

		rooms.forEach((room) => {
			if (!room.departmentId) {
				return;
			}
			const department = departments.find((dept) => dept._id === room.departmentId);
			if (department) {
				room.department = department;
			}
		});
	}
	return {
		rooms,
		count: rooms.length,
		offset,
		total,
	};
}
