import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../../settings/server';
import { getRoomRoles } from '../../../../server/lib/roles/getRoomRoles';
import { canAccessRoom } from '../../../authorization/server';
import { Rooms } from '../../../models/server';

Meteor.methods({
	getRoomRoles(rid) {
		check(rid, String);
		const fromUserId = Meteor.userId();

		if (!fromUserId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		const room = Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getRoomRoles' });
		}

		if (fromUserId && !canAccessRoom(room, { _id: fromUserId })) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getRoomRoles' });
		}

		return getRoomRoles(rid);
	},
});
