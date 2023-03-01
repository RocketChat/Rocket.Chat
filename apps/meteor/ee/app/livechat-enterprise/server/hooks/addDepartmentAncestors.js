import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import LivechatDepartment from '../../../../../app/models/server/models/LivechatDepartment';

callbacks.add(
	'livechat.newRoom',
	(room) => {
		if (!room.departmentId) {
			return room;
		}

		const department = LivechatDepartment.findOneById(room.departmentId, {
			fields: { ancestors: 1 },
		});
		if (!department || !department.ancestors) {
			return room;
		}

		const { ancestors } = department;
		Promise.await(LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors));

		return room;
	},
	callbacks.priority.MEDIUM,
	'livechat-add-department-ancestors',
);
