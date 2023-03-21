import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { LivechatTrigger } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

Meteor.methods({
	async 'livechat:removeTrigger'(triggerId) {
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'view-livechat-manager'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeTrigger',
			});
		}

		check(triggerId, String);

		await LivechatTrigger.removeById(triggerId);

		return true;
	},
});
