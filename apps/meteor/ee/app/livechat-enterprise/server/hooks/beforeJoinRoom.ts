import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { getMaxNumberSimultaneousChat } from '../lib/Helper';

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
		const maxNumberSimultaneousChat = await getMaxNumberSimultaneousChat({
			agentId: user._id,
			departmentId,
		});

		if (maxNumberSimultaneousChat === 0) {
			return user;
		}

		const userSubs = await Users.getAgentAndAmountOngoingChats(user._id);
		if (!userSubs) {
			return user;
		}

		const { queueInfo: { chats = 0 } = {} } = userSubs;
		if (maxNumberSimultaneousChat <= chats) {
			throw new Meteor.Error('error-max-number-simultaneous-chats-reached', 'Not allowed');
		}

		return user;
	},
	callbacks.priority.MEDIUM,
	'livechat-before-join-room',
);
