import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { LivechatTrigger } from '../../../models/server/raw';

Meteor.methods({
	async 'livechat:removeTrigger'(triggerId) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeTrigger',
			});
		}

		check(triggerId, String);

		await LivechatTrigger.removeById(triggerId);

		return true;
	},
});
