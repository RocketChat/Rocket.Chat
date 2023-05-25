import { LivechatDepartmentAgents, LivechatRooms, Users } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add(
	'livechat.afterTakeInquiry',
	async (inquiry) => {
		const { rid } = inquiry;
		const room = await LivechatRooms.findOneById(rid);

		if (!room) {
			return inquiry;
		}

		const { servedBy, departmentId } = room;

		if (!servedBy?._id) {
			return inquiry;
		}

		const usersToInclude = [];
		const usersToExclude = [servedBy._id];

		if (departmentId) {
			usersToInclude.push(
				(await LivechatDepartmentAgents.findByDepartmentIds([departmentId], { projection: { agentId: 1 } }).toArray()).map(
					(d) => d.agentId,
				),
			);
		}

		// Find all agents & managers & monitors from Users collection
		const cursor = Users.findAllOnlineAgentsExcludingManagersAndMonitors(usersToExclude, usersToInclude, {
			projection: { _id: 1 },
		});
		for await (const user of cursor) {
			void api.broadcast('omnichannel.events', user._id, {
				event: 'InquiryTaken',
				data: {
					inquiryId: inquiry._id,
					roomId: room._id,
					agentId: servedBy._id,
				},
			});
		}
	},
	callbacks.priority.HIGH,
	'livechat-notify-agents-inquiry-taken',
);
