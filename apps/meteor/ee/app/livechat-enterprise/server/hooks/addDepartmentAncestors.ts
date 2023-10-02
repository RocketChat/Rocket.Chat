import { LivechatRooms, LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.newRoom',
	async (room) => {
		if (!room.departmentId) {
			return room;
		}

		const department = await LivechatDepartment.findOneById(room.departmentId, {
			projection: { ancestors: 1 },
		});

		if (!department?.ancestors) {
			return room;
		}

		const { ancestors } = department;
		await LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors);

		return room;
	},
	callbacks.priority.MEDIUM,
	'livechat-add-department-ancestors',
);
