import { ILivechatRoom } from './../../../../../imports/client/@rocket.chat/apps-engine/definition/livechat/ILivechatRoom.d';
import { ILivechatAgent } from '../../../../../definition/ILivechatAgent';
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
	options,
}: {
	agents: ILivechatAgent[];
	roomName: string;
	departmentId: string;
	open: boolean;
	createdAt: string;
	closedAt: string;
	tags: string[];
	customFields: any[];
	onhold: string;
	options: { offset: number; count: number; fields: any[]; sort: string };
}): Promise<{ rooms: ILivechatRoom[]; count: number; offset: number; total: number }> {
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
			sort: options.sort || { ts: -1 },
			offset: options.offset,
			count: options.count,
			fields: options.fields,
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
		offset: options.offset,
		total,
	};
}
