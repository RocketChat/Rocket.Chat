import type { Filter } from 'mongodb';
import { LivechatDepartmentAgents, LivechatRooms, Users } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

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

		const extraQuery: Filter<IUser> = {
			_id: { $nin: [servedBy._id] },
		};

		if (departmentId) {
			extraQuery._id = {
				$in: (await LivechatDepartmentAgents.findByDepartmentIds([departmentId], { projection: { agentId: 1 } }).toArray()).map(
					(d) => d.agentId,
				),
				$nin: [servedBy._id],
			};
		}

		// Find all agents & managers & monitors from Users collection
		const users = Users.find({
			roles: 'livechat-agent',
			statusLivechat: 'available',
			status: UserStatus.ONLINE,
			...extraQuery,
		});

		for await (const user of users) {
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
