import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { Rooms } from '../../app/models';
import { canAccessRoom } from '../../app/authorization';

Meteor.methods({
	getRoomById(rid) {
		check(rid, String);
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomNameById',
			});
		}

		const room = Rooms.findOneById(rid);
		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameById',
			});
		}
		if (!canAccessRoom(room, Meteor.user())) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomById',
			});
		}
		return room;
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'getRoomById',
		userId() {
			return true;
		},
	},
	10,
	60000,
);
