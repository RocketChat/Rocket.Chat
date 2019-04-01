import { Meteor } from 'meteor/meteor';

import { Messages, Rooms } from '../../../models';
import { canAccessRoom } from '../../../authorization';
import { settings } from '../../../settings';
import { readThread } from '../../lib/Thread';

const MAX_LIMIT = 100;

Meteor.methods({
	getThreadMessages({ tmid, limit = 50, skip = 0 }) {
		if (limit > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${ MAX_LIMIT }`, { method: 'getThreadMessages' });
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThreadMessages' });
		}

		const thread = Messages.findOne({
			_id: tmid,
		});

		const user = Meteor.user();
		const room = Rooms.findOneById(thread.rid);

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		readThread({ userId: user._id, rid: thread.rid, tmid });

		const result = Messages.find({ tmid }, { skip, limit }).fetch();
		return [thread, ...result];
	},
});
