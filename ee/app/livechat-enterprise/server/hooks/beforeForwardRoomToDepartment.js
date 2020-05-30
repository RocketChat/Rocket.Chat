import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';

callbacks.add('livechat.beforeForwardRoomToDepartment', (options) => {
	const { room, transferData } = options;
	if (!room || !transferData) {
		return options;
	}
	const { departmentId } = room;
	if (!departmentId) {
		return options;
	}
	const { department: departmentToTransfer } = transferData;
	const currentDepartment = LivechatDepartment.findOneById(departmentId);
	if (!currentDepartment) {
		return options;
	}
	const { departmentsAllowedToForward } = currentDepartment;
	const isAllowedToTransfer = !departmentsAllowedToForward || (Array.isArray(departmentsAllowedToForward) && departmentsAllowedToForward.includes(departmentToTransfer._id));
	if (isAllowedToTransfer) {
		return options;
	}
	throw new Meteor.Error('error-forwarding-department-target-not-allowed', 'The forwarding to the target department is not allowed.');
}, callbacks.priority.HIGH, 'livechat-before-forward-room-to-department');
