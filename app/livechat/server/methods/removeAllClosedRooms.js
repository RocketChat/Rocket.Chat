import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms, Messages, Subscriptions } from '../../../models';

Meteor.methods({
	'livechat:removeAllClosedRooms'(departmentIds) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeAllClosedRoom' });
		}

		let count = 0;
		LivechatRooms.findClosedRooms(departmentIds).forEach(({ _id }) => {
			Messages.removeByRoomId(_id);
			Subscriptions.removeByRoomId(_id);
			LivechatRooms.removeById(_id);

			count++;
		});

		return count;
	},
});
