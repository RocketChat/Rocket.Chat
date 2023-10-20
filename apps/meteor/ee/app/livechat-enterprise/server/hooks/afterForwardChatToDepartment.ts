import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, LivechatDepartment } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.afterForwardChatToDepartment',
	async (options) => {
		const { rid, newDepartmentId } = options;

		const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'departmentAncestors'>>(rid, {
			projection: { departmentAncestors: 1 },
		});
		if (!room) {
			return options;
		}
		await LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id);

		const department = await LivechatDepartment.findOneById(newDepartmentId, {
			projection: { ancestors: 1 },
		});
		if (!department) {
			return options;
		}

		const { departmentAncestors } = room;
		const { ancestors } = department;
		if (!ancestors && !departmentAncestors) {
			return options;
		}

		cbLogger.debug(`Updating department ${newDepartmentId} ancestors for room ${rid}`);
		await LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors);

		return options;
	},
	callbacks.priority.MEDIUM,
	'livechat-after-forward-room-to-department',
);
