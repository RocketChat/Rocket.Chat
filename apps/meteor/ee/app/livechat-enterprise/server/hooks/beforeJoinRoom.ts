import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { isAgentWithinChatLimits } from '../lib/Helper';

callbacks.add(
	'beforeJoinRoom',
	async (user: IUser, room?: IRoom): Promise<IUser> => {
		if (!settings.get('Livechat_waiting_queue')) {
			return user;
		}

		if (!room || !isOmnichannelRoom(room)) {
			return user;
		}
		const { departmentId } = room;
		const userSubs = await Users.getAgentAndAmountOngoingChats(user._id, departmentId);
		if (!userSubs) {
			return user;
		}
		const { queueInfo: { chats = 0, chatsForDepartment = 0 } = {} } = userSubs;

		if (await isAgentWithinChatLimits({ agentId: user._id, departmentId, totalChats: chats, departmentChats: chatsForDepartment })) {
			return user;
		}

		throw new Error('error-max-number-simultaneous-chats-reached');
	},
	callbacks.priority.MEDIUM,
	'livechat-before-join-room',
);
