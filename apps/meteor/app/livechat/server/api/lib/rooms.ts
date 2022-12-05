import type { ILivechatDepartmentRecord, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatDepartment } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';

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
}: {
	agents?: Array<string>;
	roomName?: string;
	departmentId?: string;
	open?: boolean;
	createdAt?: {
		start?: string | undefined;
		end?: string | undefined;
	};
	closedAt?: {
		start?: string | undefined;
		end?: string | undefined;
	};
	tags?: Array<string>;
	customFields?: Record<string, string>;
	onhold?: string | boolean;
	options: { offset: number; count: number; fields: Record<string, number>; sort: Record<string, number> };
}): Promise<PaginatedResult<{ rooms: Array<IOmnichannelRoom> }>> {
	const { cursor, totalCount } = LivechatRooms.findRoomsWithCriteria({
		agents,
		roomName,
		departmentId,
		open,
		createdAt,
		closedAt,
		tags,
		customFields,
		onhold: ['t', 'true', '1'].includes(`${onhold}`),
		options: {
			sort: sort || { ts: -1 },
			offset,
			count,
			fields,
		},
	});

	const [rooms, total] = await Promise.all([cursor.toArray(), totalCount]);

	const isRoomWithDepartmentId = (depId: string | undefined): depId is string => !!depId;

	const departmentsIds = [...new Set(rooms.map((room) => room.departmentId).filter(isRoomWithDepartmentId))];
	if (departmentsIds.length) {
		const departments = await LivechatDepartment.findInIds(departmentsIds, {
			projection: { name: 1 },
		}).toArray();

		rooms.forEach((room: IOmnichannelRoom & { department?: ILivechatDepartmentRecord }) => {
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
