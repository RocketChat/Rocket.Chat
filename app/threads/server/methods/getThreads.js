import { Meteor } from 'meteor/meteor';

import { Messages, Rooms } from '../../../models';
import { canAccessRoom } from '../../../authorization';
import { settings } from '../../../settings';

const MAX_LIMIT = 100;

Meteor.methods({
	getThreads({ rid, limit = 50, skip = 0 }) {

		if (limit > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${ MAX_LIMIT }`, { method: 'getThreads' });
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThreads' });
		}

		const user = Meteor.user();
		const room = Rooms.findOneById(rid);

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not Allowed', { method: 'getThreads' });
		}

		return Messages.find({ rid, tcount: { $exists: true } }, { skip, limit }).fetch();
	},
});
