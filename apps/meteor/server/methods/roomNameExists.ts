import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms } from '../../app/models/server';
import { methodDeprecationLogger } from '../../app/lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	roomNameExists(rid) {
		check(rid, String);

		methodDeprecationLogger.warn('roomNameExists will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists',
			});
		}
		const room = Rooms.findOneByName(rid);
		return !!room;
	},
});
