import { callbacks } from '../../../../../app/callbacks/server';
import LivechatRooms from '../../../../../app/models/server/models/LivechatRooms';
import LivechatDepartment from '../../../../../app/models/server/models/LivechatDepartment';
import { setPredictedVisitorAbandonmentTime } from '../lib/Helper';

callbacks.add('livechat.afterForwardChatToDepartment', (options) => {
	const { rid, newDepartmentId } = options;

	const room = LivechatRooms.findOneById(rid);
	if (!room) {
		return;
	}
	setPredictedVisitorAbandonmentTime(room);

	const department = LivechatDepartment.findOneById(newDepartmentId, { fields: { ancestors: 1 } });
	if (!department) {
		return;
	}

	const { departmentAncestors } = room;
	const { ancestors } = department;
	if (!ancestors && !departmentAncestors) {
		return room;
	}

	LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors);

	return options;
}, callbacks.priority.MEDIUM, 'livechat-after-forward-room-to-department');
