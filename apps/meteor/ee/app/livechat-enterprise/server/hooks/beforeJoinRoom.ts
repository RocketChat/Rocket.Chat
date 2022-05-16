import { Meteor } from 'meteor/meteor';
import { isOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { Users } from '../../../../../app/models/server/raw';
import { settings } from '../../../../../app/settings/server';
import { getMaxNumberSimultaneousChat } from '../lib/Helper';

callbacks.add(
	'beforeJoinRoom',
	(user: IUser, room?: IRoom): IUser => {
		if (!settings.get('Livechat_waiting_queue')) {
			return user;
		}

		if (!room || !isOmnichannelRoom(room)) {
			return user;
		}

		const { departmentId } = room;
		const maxNumberSimultaneousChat = getMaxNumberSimultaneousChat({
			agentId: user._id,
			departmentId,
		});

		if (maxNumberSimultaneousChat === 0) {
			return user;
		}

		const userSubs = Promise.await(Users.getAgentAndAmountOngoingChats(user._id));
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
