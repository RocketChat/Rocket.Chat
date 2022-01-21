import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:removeAllClosedRooms'(departmentIds) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeAllClosedRoom',
			});
		}

		let count = 0;
		LivechatRooms.findClosedRooms(departmentIds).forEach(({ _id }) => {
			Livechat.removeRoom(_id);
			count++;
		});

		return count;
	},
});
