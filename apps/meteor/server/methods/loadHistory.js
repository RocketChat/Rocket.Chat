import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions, Rooms } from '../../app/models/server';
import { canAccessRoom, hasPermission, roomAccessAttributes } from '../../app/authorization/server';
import { settings } from '../../app/settings/server';
import { loadMessageHistory } from '../../app/lib/server';

Meteor.methods({
	loadHistory(rid, end, limit = 20, ls, showThreadMessages = true) {
		check(rid, String);

		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory',
			});
		}

		const fromId = Meteor.userId();

		const room = Rooms.findOneById(rid, { fields: { ...roomAccessAttributes, t: 1 } });
		if (!room) {
			return false;
		}

		if (!canAccessRoom(room, { _id: fromId })) {
			return false;
		}

		const canAnonymous = settings.get('Accounts_AllowAnonymousRead');
		const canPreview = hasPermission(fromId, 'preview-c-room');

		if (room.t === 'c' && !canAnonymous && !canPreview && !Subscriptions.findOneByRoomIdAndUserId(rid, fromId, { fields: { _id: 1 } })) {
			return false;
		}

		return loadMessageHistory({ userId: fromId, rid, end, limit, ls, showThreadMessages });
	},
});
