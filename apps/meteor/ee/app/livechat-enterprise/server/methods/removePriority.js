import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:removePriority'(id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-priorities')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removePriority',
			});
		}

		await LivechatEnterprise.removePriority(id);
	},
});
