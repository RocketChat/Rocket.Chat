import { Meteor } from 'meteor/meteor';

import { Messages, Rooms } from '../../../models';
import { canAccessRoom } from '../../../authorization';
import { settings } from '../../../settings';

const MAX_LIMIT = 100;

Meteor.methods({
	getThread({ tmid, limit = 50, skip = 0 }) {

		if (limit > MAX_LIMIT) {
			throw new Meteor.Error('error-not-allowed', `max limit: ${ MAX_LIMIT }`, { method: 'getThread' });
		}

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThread' });
		}

		const thread = Messages.findOne({
			_id: tmid,
		});

		const user = Meteor.user();
		const room = Rooms.findOneById(thread.rid);

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThread' });
		}

		const result = Messages.find({ tmid }, { skip, limit }).fetch();
		return [thread, ...result];
	},
});
