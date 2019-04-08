import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { ChatSubscription } from 'meteor/rocketchat:models';

const DURATION_WEEK = 1000 * 60 * 60 * 24 * 7;
Meteor.methods({
	hideOldSubscriptions(userId = Meteor.userId(), idleDuration = DURATION_WEEK) {
		if (!Meteor.userId()) {
			return 0;
		}

		if (!Match.test(idleDuration, Number)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'hideOldSubscriptions',
			});
		}

		const thresholdDate = new Date(new Date() - idleDuration);

		const query = {
			'u._id': userId,
			alert: false, // ignore unred rooms
			f: { $ne: true }, // ignore favored rooms
			ls: { $lt: thresholdDate },
		};

		return ChatSubscription.update(
			query,
			{
				$set: {
					alert: false,
					open: false,
				},
			},
			{ multi: true });
	},
});
