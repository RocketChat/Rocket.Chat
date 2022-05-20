import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../app/authorization';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

Meteor.methods({
	'livechat:removeUnit'(id) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-units')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeUnit' });
		}

		return LivechatEnterprise.removeUnit(id);
	},
});
