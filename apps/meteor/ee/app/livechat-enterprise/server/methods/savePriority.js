import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:savePriority'(_id, priorityData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-priorities')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:savePriority',
			});
		}

		return LivechatEnterprise.savePriority(_id, priorityData);
	},
});
