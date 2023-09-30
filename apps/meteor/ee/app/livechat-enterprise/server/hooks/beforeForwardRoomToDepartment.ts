import type { ILivechatDepartment } from '@rocket.chat/core-typings';
import { LivechatDepartment } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';

callbacks.add(
	'livechat.beforeForwardRoomToDepartment',
	async (options) => {
		const { room, transferData } = options;
		if (!room || !transferData) {
			return options;
		}
		const { departmentId } = room;
		if (!departmentId) {
			return options;
		}
		const { department: departmentToTransfer } = transferData;
		const currentDepartment = await LivechatDepartment.findOneById<Pick<ILivechatDepartment, 'departmentsAllowedToForward'>>(departmentId, {
			projection: { departmentsAllowedToForward: 1 },
		});
		if (!currentDepartment) {
			return options;
		}
		const { departmentsAllowedToForward } = currentDepartment;
		const isAllowedToTransfer =
			!departmentsAllowedToForward?.length ||
			(Array.isArray(departmentsAllowedToForward) && departmentsAllowedToForward.includes(departmentToTransfer._id));
		if (isAllowedToTransfer) {
			return options;
		}
		throw new Meteor.Error('error-forwarding-department-target-not-allowed', 'The forwarding to the target department is not allowed.');
	},
	callbacks.priority.HIGH,
	'livechat-before-forward-room-to-department',
);
