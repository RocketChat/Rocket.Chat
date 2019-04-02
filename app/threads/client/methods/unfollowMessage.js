import { Meteor } from 'meteor/meteor';

import { Messages, Room } from '../../../models';
import { settings } from '../../../settings';
import { unfollow } from '../../lib/Thread';
import { canAccessRoom } from '../../../authorization/server';

Meteor.methods({
	unfollowMessage({ mid }) {
		const uid = Meteor.userId();
		if (!uid || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'unfollowMessage' });
		}

		const message = Messages.findOne(mid, { fields: { rid: 1, tmid: 1 } });

		if (!message) {
			throw new Meteor.Error('error-invalid-message', 'Message invalid', { method: 'unfollowMessage' });
		}

		const room = Room.findOne({ _id: message.rid });

		if (!canAccessRoom(room, Meteor.user())) {
			throw new Meteor.Error('error-not-allowed', 'not allowed', { method: 'unfollowMessage' });
		}

		return unfollow({ tmid: message.tmid || message._id, uid });
	},
});
