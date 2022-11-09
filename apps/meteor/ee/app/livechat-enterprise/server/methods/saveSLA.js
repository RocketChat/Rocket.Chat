import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:saveSLA'(_id, slaData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-sla')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveSLA',
			});
		}

		return LivechatEnterprise.saveSLA(_id, slaData);
	},
});
