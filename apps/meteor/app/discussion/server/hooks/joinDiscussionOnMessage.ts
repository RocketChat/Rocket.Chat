import { Subscriptions, Users } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { joinRoomMethod } from '../../../lib/server/methods/joinRoom';

callbacks.add(
	'beforeSaveMessage',
	async (message, room) => {
		// abort if room is not a discussion
		if (!room?.prid) {
			return message;
		}

		// check if user already joined the discussion
		const sub = await Subscriptions.findOneByRoomIdAndUserId(room._id, message.u._id, {
			projection: { _id: 1 },
		});

		if (sub) {
			return message;
		}

		const user = await Users.findOneById(message.u._id);
		if (!user) {
			return message;
		}
		await joinRoomMethod(user, room._id);

		return message;
	},
	callbacks.priority.MEDIUM,
	'joinDiscussionOnMessage',
);
