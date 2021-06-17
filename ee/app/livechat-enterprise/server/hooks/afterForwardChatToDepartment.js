import { callbacks } from '../../../../../app/callbacks/server';
import LivechatRooms from '../../../../../server/models/models/LivechatRooms';
import LivechatDepartment from '../../../../../server/models/models/LivechatDepartment';

callbacks.add('livechat.afterForwardChatToDepartment', (options) => {
	const { rid, newDepartmentId } = options;

	const room = LivechatRooms.findOneById(rid);
	if (!room) {
		return options;
	}
	LivechatRooms.unsetPredictedVisitorAbandonmentByRoomId(room._id);

	const department = LivechatDepartment.findOneById(newDepartmentId, { fields: { ancestors: 1 } });
	if (!department) {
		return options;
	}

	const { departmentAncestors } = room;
	const { ancestors } = department;
	if (!ancestors && !departmentAncestors) {
		return options;
	}

	LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors);

	return options;
}, callbacks.priority.MEDIUM, 'livechat-after-forward-room-to-department');
