import { Meteor } from 'meteor/meteor';
import { Subscriptions } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

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

		// if no subscription, call join
		await Meteor.runAsUser(message.u._id, () => Meteor.callAsync('joinRoom', room._id));

		return message;
	},
	callbacks.priority.MEDIUM,
	'joinDiscussionOnMessage',
);
