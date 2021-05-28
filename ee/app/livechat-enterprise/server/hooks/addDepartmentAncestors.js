import { callbacks } from '../../../../../app/callbacks';
import LivechatRooms from '../../../../../server/models/models/LivechatRooms';
import LivechatDepartment from '../../../../../server/models/models/LivechatDepartment';

callbacks.add('livechat.newRoom', (room) => {
	if (!room.departmentId) {
		return room;
	}

	const department = LivechatDepartment.findOneById(room.departmentId, { fields: { ancestors: 1 } });
	if (!department || !department.ancestors) {
		return room;
	}

	const { ancestors } = department;
	LivechatRooms.updateDepartmentAncestorsById(room._id, ancestors);


	return room;
}, callbacks.priority.MEDIUM, 'livechat-add-department-ancestors');
