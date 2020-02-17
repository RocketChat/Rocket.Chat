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
			sort: sort || { ts: -1 },
			offset,
			count,
			fields,
		},
	});
	const departmentsIds = [...new Set(rooms.map((room) => room.departmentId).filter(Boolean))];
	const departments = await LivechatDepartment.findInIds(departmentsIds, { fields: { name: 1 } });
	if (departments.length && departmentsIds.length) {
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
