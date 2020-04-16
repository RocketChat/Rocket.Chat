import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../app/callbacks';
import { LivechatDepartment } from '../../../../../app/models/server';

callbacks.add('livechat.beforeForwardRoomToDepartment', (room, transferData) => {
	if (!room || !transferData) {
		return;
	}
	const { departmentId } = room;
	if (!departmentId) {
		return;
	}
	const { department: departmentToTransfer } = transferData;
	const currentDepartment = LivechatDepartment.findOneById(departmentId);
	if (!currentDepartment) {
		return;
	}
	const { departmentsAllowedToForward } = currentDepartment;
	const isAllowedToTransfer = !departmentsAllowedToForward || (Array.isArray(departmentsAllowedToForward) && departmentsAllowedToForward.includes(departmentToTransfer._id));
	if (isAllowedToTransfer) {
		return;
	}
	throw new Meteor.Error('error-forwarding-department-target-not-allowed', 'The forwarding to the target department is not allowed.');
}, callbacks.priority.HIGH, 'livechat-before-forward-room-to-department');
