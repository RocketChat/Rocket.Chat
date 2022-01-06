import { callbacks } from '../../../../../lib/callbacks';
import LivechatRooms from '../../../../../app/models/server/models/LivechatRooms';
import LivechatDepartment from '../../../../../app/models/server/models/LivechatDepartment';
import { cbLogger } from '../lib/logger';

callbacks.add(
	'livechat.afterForwardChatToDepartment',
	(options) => {
		const { rid, newDepartmentId } = options;

		const room = LivechatRooms.findOneById(rid);
		if (!room) {
			cbLogger.debug('Skipping callback. No room found');
			return options;
		}
		LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id);

		const department = LivechatDepartment.findOneById(newDepartmentId, {
			fields: { ancestors: 1 },
		});
		if (!department) {
			cbLogger.debug('Skipping callback. No department found');
			return options;
		}

		const { departmentAncestors } = room;
		const { ancestors } = department;
		if (!ancestors && !departmentAncestors) {
			cbLogger.debug('Skipping callback. No ancestors found for department');
			return options;
		}

		cbLogger.debug(`Updating department ${newDepartmentId} ancestors for room ${rid}`);
		LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors);

		return options;
	},
	callbacks.priority.MEDIUM,
	'livechat-after-forward-room-to-department',
);
