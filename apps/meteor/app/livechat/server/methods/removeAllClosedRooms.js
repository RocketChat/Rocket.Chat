import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatRooms } from '../../../models/server';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:removeAllClosedRooms'(departmentIds) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'remove-closed-livechat-rooms')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeAllClosedRoom',
			});
		}

		let count = 0;
		// These are not debug logs since we want to know when the action is performed
		Livechat.logger.info(`User ${Meteor.userId()} is removing all closed rooms`);
		LivechatRooms.findClosedRooms(departmentIds).forEach(({ _id }) => {
			Livechat.removeRoom(_id);
			count++;
		});

		Livechat.logger.info(`User ${Meteor.userId()} removed ${count} closed rooms`);
		return count;
	},
});
