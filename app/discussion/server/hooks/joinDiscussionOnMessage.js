import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { Subscriptions } from '../../../models/server';

callbacks.add(
	'beforeSaveMessage',
	(message, room) => {
		// abort if room is not a discussion
		if (!room || !room.prid) {
			return message;
		}

		// check if user already joined the discussion
		const sub = Subscriptions.findOneByRoomIdAndUserId(room._id, message.u._id, {
			fields: { _id: 1 },
		});
		if (sub) {
			return message;
		}

		// if no subcription, call join
		Meteor.runAsUser(message.u._id, () => Meteor.call('joinRoom', room._id));

		return message;
	},
	callbacks.priority.MEDIUM,
	'joinDiscussionOnMessage',
);
