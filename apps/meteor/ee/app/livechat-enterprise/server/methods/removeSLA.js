import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	async 'livechat:removeSLA'(id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-sla')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeSLA',
			});
		}

		await LivechatEnterprise.removeSLA(id);
	},
});
