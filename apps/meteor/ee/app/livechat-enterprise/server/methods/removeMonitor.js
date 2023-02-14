import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:removeMonitor'(username) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-monitors')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeMonitor',
			});
		}

		return LivechatEnterprise.removeMonitor(username);
	},
});
